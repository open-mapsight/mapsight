import pidtree from "pidtree";
import {expect, it} from "vitest";

/**
 * Bench helpers use pidtree to walk Playwright browser process trees.
 * pidtree@1 is ESM-only; keep a focused smoke test so the major bump
 * cannot silently break that import/API shape.
 */
it("resolves a process tree including the root pid", async () => {
	const tree = await pidtree(process.pid, {root: true});

	expect(Array.isArray(tree)).toBe(true);
	expect(tree.map(Number)).toContain(process.pid);
});

it("resolves child pids without requiring the root option", async () => {
	const tree = await pidtree(process.pid);

	expect(Array.isArray(tree)).toBe(true);
});
