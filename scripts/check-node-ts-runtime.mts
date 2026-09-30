import {existsSync, readFileSync, readdirSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SCAN_ROOTS = [
	".github/workflows",
	".github/actions",
	".husky",
	"apps",
	"configs",
	"e2e",
	"packages",
	"scripts",
	"starters",
] as const;

const PACKAGE_JSON = "package.json";

/** Legacy TypeScript-on-Node runners — use plain `node file.ts` on Node 24+. */
const FORBIDDEN_PATTERNS: Array<{label: string; pattern: RegExp}> = [
	{label: "jiti", pattern: /\bjiti\b/},
	{
		label: "experimental-strip-types",
		pattern: /experimental-strip-types/,
	},
	{label: "ts-node", pattern: /\bts-node(?:-esm)?\b/},
	{label: "tsx runner", pattern: /\b(?:pnpm exec |pnpx |npx )tsx\b/},
	{
		label: "shell wrapper for TS script",
		pattern: /\bsh\s+[^\n]*scripts\/[^\n]+\.(?:mts|ts)\b/,
	},
];

type Violation = {
	file: string;
	label: string;
	line: number;
	text: string;
};

function relativePath(filePath: string): string {
	return path.relative(ROOT, filePath).split(path.sep).join("/");
}

function scanText(filePath: string, content: string): Array<Violation> {
	const violations: Array<Violation> = [];
	const lines = content.split("\n");

	for (const [index, line] of lines.entries()) {
		if (line.trim().startsWith("#")) {
			continue;
		}

		for (const {label, pattern} of FORBIDDEN_PATTERNS) {
			if (pattern.test(line)) {
				violations.push({
					file: relativePath(filePath),
					label,
					line: index + 1,
					text: line.trim(),
				});
			}
		}
	}

	return violations;
}

function collectFiles(dir: string, acc: Array<string> = []): Array<string> {
	if (!existsSync(dir)) {
		return acc;
	}

	for (const entry of readdirSync(dir, {withFileTypes: true})) {
		if (
			entry.name === "node_modules" ||
			entry.name === "dist" ||
			entry.name === ".next" ||
			entry.name === "_"
		) {
			continue;
		}

		const entryPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			collectFiles(entryPath, acc);
			continue;
		}

		if (
			entry.name === PACKAGE_JSON ||
			entry.name.endsWith(".yml") ||
			entry.name.endsWith(".yaml") ||
			entry.name.endsWith(".sh") ||
			(entryPath.startsWith(path.join(ROOT, ".husky")) &&
				!entry.name.includes("."))
		) {
			acc.push(entryPath);
		}
	}

	return acc;
}

function scanPackageJsonScripts(filePath: string): Array<Violation> {
	const {scripts} = JSON.parse(readFileSync(filePath, "utf8")) as {
		scripts?: Record<string, string>;
	};
	if (!scripts) {
		return [];
	}

	const violations: Array<Violation> = [];

	for (const [scriptName, command] of Object.entries(scripts)) {
		for (const {label, pattern} of FORBIDDEN_PATTERNS) {
			if (pattern.test(command)) {
				violations.push({
					file: relativePath(filePath),
					label,
					line: 0,
					text: `${scriptName}: ${command}`,
				});
			}
		}
	}

	return violations;
}

function main() {
	const files = new Set<string>();

	for (const scanRoot of SCAN_ROOTS) {
		for (const filePath of collectFiles(path.join(ROOT, scanRoot))) {
			files.add(filePath);
		}
	}

	files.add(path.join(ROOT, PACKAGE_JSON));

	const violations: Array<Violation> = [];

	for (const filePath of files) {
		if (filePath.endsWith(PACKAGE_JSON)) {
			violations.push(...scanPackageJsonScripts(filePath));
			continue;
		}

		violations.push(...scanText(filePath, readFileSync(filePath, "utf8")));
	}

	if (violations.length > 0) {
		console.error("Node TypeScript runtime check failed:\n");
		for (const violation of violations) {
			const location =
				violation.line > 0
					? `${violation.file}:${violation.line}`
					: violation.file;
			console.error(
				`- ${location} (${violation.label}): ${violation.text}`,
			);
		}
		console.error(
			"\nUse plain `node path/to/script.ts` on Node 24+ (native type stripping).",
		);
		process.exit(1);
	}

	console.log("Node TypeScript runtime check passed.");
}

main();
