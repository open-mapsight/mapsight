import {execSync} from "node:child_process";
import {existsSync, readFileSync, readdirSync} from "node:fs";
import path from "node:path";

const PATH_PREFIXES = ["private/"] as const;
const LOCKFILE_IMPORTER_PREFIX = "private/";
const PRIVATE_BRANCH_PATTERNS = ["private/*"] as const;

type Mode = "commits" | "push" | "staged" | "workspace";
type Visibility = "auto" | "private" | "public";

const args = process.argv.slice(2);
const options = {
	commitRange: "",
	mode: "workspace" as Mode,
	remote: "",
	visibility: "auto" as Visibility,
};

for (let index = 0; index < args.length; index += 1) {
	const arg = args[index];
	if (arg === "--") {
		continue;
	}

	switch (arg) {
		case "--mode":
			options.mode = args[++index] as Mode;
			break;
		case "--visibility":
			options.visibility = args[++index] as Visibility;
			break;
		case "--commit-range":
			options.commitRange = args[++index] ?? "";
			break;
		case "--remote":
			options.remote = args[++index] ?? "";
			break;
		default:
			throw new Error(`Unknown argument: ${arg}`);
	}
}

const root = execSync("git rev-parse --show-toplevel", {
	encoding: "utf8",
}).trim();

const normalizePath = (filePath: string): string =>
	filePath.replace(/\\/g, "/");

const matchesPattern = (value: string, pattern: string): boolean => {
	if (pattern.endsWith("/*")) {
		return value.startsWith(pattern.slice(0, -1));
	}

	return value === pattern;
};

const getCurrentBranch = (): string => {
	try {
		return execSync("git branch --show-current", {
			cwd: root,
			encoding: "utf8",
		}).trim();
	} catch {
		return "";
	}
};

const resolveVisibility = (): Visibility => {
	if (options.visibility !== "auto") {
		return options.visibility;
	}

	const branch = getCurrentBranch();
	if (
		branch &&
		PRIVATE_BRANCH_PATTERNS.some((pattern) =>
			matchesPattern(branch, pattern),
		)
	) {
		return "private";
	}

	return "public";
};

const isForbiddenPath = (filePath: string): boolean => {
	const normalized = normalizePath(filePath);

	return PATH_PREFIXES.some(
		(prefix) =>
			normalized === prefix.replace(/\/$/, "") ||
			normalized.startsWith(prefix),
	);
};

const getLockfileViolations = (lockfileContent: string): string[] => {
	const prefix = LOCKFILE_IMPORTER_PREFIX.replace(/\/$/, "");
	const pattern = new RegExp(
		`^  (${prefix.replaceAll("/", "\\/")}\\/[^:]+):`,
		"gm",
	);
	const violations = new Set<string>();

	for (const match of lockfileContent.matchAll(pattern)) {
		violations.add(`pnpm-lock.yaml importer "${match[1]}"`);
	}

	return [...violations];
};

const getStagedPaths = (): string[] =>
	execSync("git diff --cached --name-only --diff-filter=ACMR", {
		cwd: root,
		encoding: "utf8",
	})
		.split("\n")
		.map(normalizePath)
		.filter(Boolean);

const getCommitPaths = (commitRange: string): string[] =>
	execSync(`git diff --name-only --diff-filter=ACMR ${commitRange}`, {
		cwd: root,
		encoding: "utf8",
	})
		.split("\n")
		.map(normalizePath)
		.filter(Boolean);

const getWorkspacePaths = (): string[] => {
	const tracked = execSync("git ls-files", {cwd: root, encoding: "utf8"})
		.split("\n")
		.map(normalizePath)
		.filter(Boolean);

	const privateDir = path.join(root, "private");
	if (!existsSync(privateDir)) {
		return tracked;
	}

	const walkPrivate = (
		directory: string,
		relativeDirectory: string,
	): string[] => {
		const entries = readdirSync(directory, {withFileTypes: true});
		const paths: string[] = [];

		for (const entry of entries) {
			const relativePath = relativeDirectory
				? `${relativeDirectory}/${entry.name}`
				: entry.name;
			const gitPath = `private/${relativePath}`;

			if (entry.isDirectory()) {
				paths.push(
					...walkPrivate(
						path.join(directory, entry.name),
						relativePath,
					),
				);
				continue;
			}

			if (!tracked.includes(gitPath)) {
				paths.push(gitPath);
			}
		}

		return paths;
	};

	return [...tracked, ...walkPrivate(privateDir, "")];
};

const getPushCommitRanges = (): string[] => {
	const stdin = readFileSync(0, "utf8").trim();
	if (!stdin) {
		return [];
	}

	const ranges: string[] = [];

	for (const line of stdin.split("\n")) {
		const [localRef, localSha, , remoteSha] = line.split(/\s+/);
		if (!localRef || !localSha) {
			continue;
		}

		if (localSha === "0000000000000000000000000000000000000000") {
			continue;
		}

		if (remoteSha === "0000000000000000000000000000000000000000") {
			ranges.push(localSha);
			continue;
		}

		ranges.push(`${remoteSha}..${localSha}`);
	}

	return ranges;
};

const collectViolations = (paths: string[]): string[] => {
	const violations = paths
		.filter(isForbiddenPath)
		.map((filePath) => `path "${filePath}"`);

	const lockfilePaths = paths.filter(
		(filePath) => filePath === "pnpm-lock.yaml",
	);
	if (lockfilePaths.length > 0) {
		const lockfilePath = path.join(root, "pnpm-lock.yaml");
		if (existsSync(lockfilePath)) {
			const lockfileContent = readFileSync(lockfilePath, "utf8");
			violations.push(...getLockfileViolations(lockfileContent));
		}
	}

	return violations;
};

const run = (): void => {
	const visibility = resolveVisibility();
	if (visibility === "private") {
		return;
	}

	const violations = new Set<string>();

	if (options.mode === "staged") {
		for (const violation of collectViolations(getStagedPaths())) {
			violations.add(violation);
		}
	}

	if (options.mode === "workspace") {
		for (const violation of collectViolations(getWorkspacePaths())) {
			violations.add(violation);
		}

		const lockfilePath = path.join(root, "pnpm-lock.yaml");
		if (existsSync(lockfilePath)) {
			for (const violation of getLockfileViolations(
				readFileSync(lockfilePath, "utf8"),
			)) {
				violations.add(violation);
			}
		}
	}

	if (options.mode === "commits") {
		if (!options.commitRange) {
			throw new Error("--commit-range is required for commits mode");
		}

		for (const violation of collectViolations(
			getCommitPaths(options.commitRange),
		)) {
			violations.add(violation);
		}
	}

	if (options.mode === "push") {
		for (const commitRange of getPushCommitRanges()) {
			for (const violation of collectViolations(
				getCommitPaths(commitRange),
			)) {
				violations.add(violation);
			}
		}
	}

	if (violations.size === 0) {
		return;
	}

	const branch = getCurrentBranch();
	const remoteSuffix = options.remote ? ` (remote: ${options.remote})` : "";

	throw new Error(
		[
			`error: private content must not be published from branch "${branch || "detached"}"${remoteSuffix}.`,
			"Blocked:",
			...[...violations].map((violation) => `  - ${violation}`),
		].join("\n"),
	);
};

run();
