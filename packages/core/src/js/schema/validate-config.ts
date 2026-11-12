import type {ZodError, ZodType, z} from "zod";

import {isDevelopment} from "@/lib/helpers/isDevelopment";

type $ZodIssue = ZodError["issues"][number];

type FlatIssue = {path: PropertyKey[]; message: string};

/** Lower is better: the branch whose literal discriminator did not match is worst. */
function branchScore(issues: $ZodIssue[]): [number, number, number] {
	const literalMismatch = issues.some((i) => i.code === "invalid_value")
		? 1
		: 0;
	const depth = Math.max(0, ...issues.map((i) => i.path.length));
	return [literalMismatch, -depth, issues.length];
}

function compareScores(
	a: [number, number, number],
	b: [number, number, number],
): number {
	return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

/**
 * Message for a union where every branch only rejected the value's type (for
 * example `expected string | boolean | number, received function`).
 */
function mergeTypeMismatches(branches: $ZodIssue[][]): string | undefined {
	const issues = branches.flatMap((branch) =>
		branch.length === 1 &&
		branch[0]?.code === "invalid_type" &&
		branch[0].path.length === 0
			? [branch[0]]
			: [],
	);
	if (issues.length !== branches.length || !issues[0]) {
		return undefined;
	}
	const expected = [...new Set(issues.map((i) => i.expected))];
	// Zod has no structured "received" value; its message ends with it.
	const marker = "received ";
	const markerIndex = issues[0].message.indexOf(marker);
	const received =
		markerIndex === -1
			? undefined
			: issues[0].message.slice(markerIndex + marker.length);
	return `Invalid input: expected ${expected.join(" | ")}${
		received ? `, received ${received}` : ""
	}`;
}

function flattenIssue(issue: $ZodIssue, basePath: PropertyKey[]): FlatIssue[] {
	const path = [...basePath, ...issue.path];
	if (issue.code !== "invalid_union" || issue.errors.length === 0) {
		return [{path, message: issue.message}];
	}

	const branches = issue.errors as $ZodIssue[][];
	const merged = mergeTypeMismatches(branches);
	if (merged) {
		return [{path, message: merged}];
	}

	const best = branches.reduce((a, b) =>
		compareScores(branchScore(b), branchScore(a)) < 0 ? b : a,
	);
	return best.flatMap((branchIssue) => flattenIssue(branchIssue, path));
}

const pathKey = (path: PropertyKey[]) => JSON.stringify(path.map(String));

/**
 * Formats Zod issues as `[context] path: message; path: message`. For union
 * issues it reports the most relevant branch instead of Zod's generic message.
 */
export function formatZodError(error: ZodError, context?: string): string {
	const prefix = context ? `[${context}] ` : "";
	// A more specific issue at the same path supersedes a generic union message.
	const specificPaths = new Set(
		error.issues
			.filter((issue) => issue.code !== "invalid_union")
			.map((issue) => pathKey(issue.path)),
	);
	const messages = error.issues
		.filter(
			(issue) =>
				issue.code !== "invalid_union" ||
				!specificPaths.has(pathKey(issue.path)),
		)
		.flatMap((issue) => flattenIssue(issue, []))
		.map(({path, message}) => {
			const label =
				path.length > 0 ? path.map(String).join(".") : "(root)";
			return `${label}: ${message}`;
		});
	return `${prefix}${messages.join("; ")}`;
}

export function validateConfig<T extends ZodType>(
	schema: T,
	config: unknown,
	options?: {strict?: boolean; context?: string},
): z.infer<T> {
	const result = schema.safeParse(config);

	if (!result.success) {
		const msg = formatZodError(result.error, options?.context);
		if (isDevelopment()) {
			console.warn("[mapsight] Config validation failed:", msg);
		} else if (options?.strict) {
			throw new Error(msg);
		}
		return config as z.infer<T>;
	}

	return result.data;
}
