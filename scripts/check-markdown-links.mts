import {existsSync, readFileSync, readdirSync, statSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const GITHUB_REPO_PREFIX =
	/^https:\/\/github\.com\/open-mapsight\/mapsight\/(?:blob|tree)\/main\//;

/** Inline markdown links and images: `[text](url)` / `![alt](url)`. */
const MARKDOWN_LINK_RE =
	/!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)|\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

type LinkHit = {
	file: string;
	line: number;
	href: string;
};

type Violation = LinkHit & {
	reason: string;
};

/**
 * GitHub-flavored Markdown heading id (GFM / github-slugger subset).
 * Lowercase, strip punctuation except spaces/hyphens/underscores, then
 * each space → hyphen (consecutive spaces become `--`, matching GitHub).
 * Duplicate headings get `-1`, `-2`, … suffixes (second occurrence is `-1`).
 */
export function githubHeadingSlug(headingText: string): string {
	return headingText
		.trim()
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s_-]/gu, "")
		.replace(/ /g, "-");
}

export function collectHeadingAnchors(markdown: string): Set<string> {
	const counts = new Map<string, number>();
	const anchors = new Set<string>();

	for (const line of markdown.split("\n")) {
		const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
		if (!match?.[2]) {
			continue;
		}
		const text = match[2]
			.replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
			.replace(/`([^`]*)`/g, "$1")
			.replace(/[<>]/g, "");
		const base = githubHeadingSlug(text);
		if (!base) {
			continue;
		}
		const seen = counts.get(base) ?? 0;
		counts.set(base, seen + 1);
		const anchor = seen === 0 ? base : `${base}-${seen}`;
		anchors.add(anchor);
	}

	return anchors;
}

export function extractMarkdownHrefs(markdown: string): Array<{
	href: string;
	line: number;
}> {
	const hits: Array<{href: string; line: number}> = [];
	const lines = markdown.split("\n");

	for (const [index, line] of lines.entries()) {
		MARKDOWN_LINK_RE.lastIndex = 0;
		let match: RegExpExecArray | null;
		while ((match = MARKDOWN_LINK_RE.exec(line)) !== null) {
			const href = match[1] ?? match[2];
			if (!href) {
				continue;
			}
			hits.push({href, line: index + 1});
		}
	}

	return hits;
}

function relativePosix(filePath: string): string {
	return path.relative(ROOT, filePath).split(path.sep).join("/");
}

function walkMarkdownFiles(dir: string, out: string[]): void {
	if (!existsSync(dir)) {
		return;
	}
	for (const entry of readdirSync(dir, {withFileTypes: true})) {
		if (entry.name === "node_modules" || entry.name === "dist") {
			continue;
		}
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walkMarkdownFiles(full, out);
			continue;
		}
		if (entry.isFile() && entry.name.endsWith(".md")) {
			out.push(full);
		}
	}
}

export function listMarkdownFilesToCheck(root: string = ROOT): string[] {
	const files: string[] = [];
	const rootReadme = path.join(root, "README.md");
	if (existsSync(rootReadme)) {
		files.push(rootReadme);
	}
	walkMarkdownFiles(path.join(root, "docs"), files);
	walkMarkdownFiles(path.join(root, "starters"), files);

	const packagesDir = path.join(root, "packages");
	if (existsSync(packagesDir)) {
		for (const entry of readdirSync(packagesDir, {withFileTypes: true})) {
			if (!entry.isDirectory()) {
				continue;
			}
			const pkgRoot = path.join(packagesDir, entry.name);
			const readme = path.join(pkgRoot, "README.md");
			if (existsSync(readme)) {
				files.push(readme);
			}
			walkMarkdownFiles(path.join(pkgRoot, "docs"), files);
		}
	}

	return files.sort();
}

function splitHref(href: string): {pathPart: string; anchor: string | null} {
	const hash = href.indexOf("#");
	if (hash === -1) {
		return {pathPart: href, anchor: null};
	}
	return {
		pathPart: href.slice(0, hash),
		anchor: decodeURIComponent(href.slice(hash + 1)),
	};
}

function isSkippableExternal(href: string): boolean {
	if (GITHUB_REPO_PREFIX.test(href)) {
		return false;
	}
	return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href);
}

function resolveLocalTarget(
	fromFile: string,
	pathPart: string,
): {absolute: string | null; display: string} {
	if (pathPart === "" || pathPart === ".") {
		return {absolute: fromFile, display: relativePosix(fromFile)};
	}

	const github = pathPart.match(GITHUB_REPO_PREFIX);
	if (github) {
		const repoPath = pathPart.slice(github[0].length).split("?")[0] ?? "";
		const absolute = path.join(ROOT, repoPath);
		return {absolute, display: repoPath};
	}

	if (pathPart.startsWith("/")) {
		return {
			absolute: null,
			display: pathPart,
		};
	}

	const absolute = path.resolve(path.dirname(fromFile), pathPart);
	return {absolute, display: relativePosix(absolute)};
}

function fileExistsAsLinkTarget(absolute: string): boolean {
	if (!existsSync(absolute)) {
		return false;
	}
	const stat = statSync(absolute);
	return stat.isFile() || stat.isDirectory();
}

function checkLink(
	fromFile: string,
	href: string,
	line: number,
	headingCache: Map<string, Set<string>>,
): Violation | null {
	if (isSkippableExternal(href)) {
		return null;
	}

	const {pathPart, anchor} = splitHref(href);

	if (pathPart.startsWith("/")) {
		return {
			file: relativePosix(fromFile),
			line,
			href,
			reason: "root-absolute markdown paths are not supported; use a relative or GitHub URL",
		};
	}

	const {absolute, display} = resolveLocalTarget(fromFile, pathPart);
	if (!absolute) {
		return {
			file: relativePosix(fromFile),
			line,
			href,
			reason: "could not resolve path",
		};
	}

	if (!fileExistsAsLinkTarget(absolute)) {
		return {
			file: relativePosix(fromFile),
			line,
			href,
			reason: `missing target ${display}`,
		};
	}

	if (!anchor) {
		return null;
	}

	let targetFile = absolute;
	if (statSync(absolute).isDirectory()) {
		const readme = path.join(absolute, "README.md");
		if (!existsSync(readme)) {
			return {
				file: relativePosix(fromFile),
				line,
				href,
				reason: `directory ${display} has no README.md for anchor #${anchor}`,
			};
		}
		targetFile = readme;
	} else if (!absolute.endsWith(".md")) {
		// Anchors on non-markdown (images, etc.) are not checked.
		return null;
	}

	let anchors = headingCache.get(targetFile);
	if (!anchors) {
		anchors = collectHeadingAnchors(readFileSync(targetFile, "utf8"));
		headingCache.set(targetFile, anchors);
	}

	if (!anchors.has(anchor)) {
		return {
			file: relativePosix(fromFile),
			line,
			href,
			reason: `missing heading anchor #${anchor} in ${relativePosix(targetFile)}`,
		};
	}

	return null;
}

export function checkMarkdownLinks(root: string = ROOT): Violation[] {
	const headingCache = new Map<string, Set<string>>();
	const violations: Violation[] = [];

	for (const file of listMarkdownFilesToCheck(root)) {
		const content = readFileSync(file, "utf8");
		for (const {href, line} of extractMarkdownHrefs(content)) {
			const violation = checkLink(file, href, line, headingCache);
			if (violation) {
				violations.push(violation);
			}
		}
	}

	return violations;
}

function main(): void {
	const violations = checkMarkdownLinks();
	if (violations.length === 0) {
		console.log("Markdown link check passed.");
		return;
	}

	console.error("Markdown link check failed:\n");
	for (const violation of violations) {
		console.error(
			`  ${violation.file}:${violation.line}: ${violation.href}\n    ${violation.reason}`,
		);
	}
	console.error(`\n${violations.length} broken link(s).`);
	process.exitCode = 1;
}

const isDirectRun =
	process.argv[1] !== undefined &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
	main();
}
