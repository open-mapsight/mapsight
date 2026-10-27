import assert from "node:assert/strict";
import {test} from "node:test";

import {type BuildRun, type Pull, deploymentTarget} from "./preview-deploy.mts";

const sha = "a".repeat(40);
const run: BuildRun = {
	id: 1,
	path: ".github/workflows/showcase-build.yml",
	event: "pull_request",
	status: "completed",
	conclusion: "success",
	head_sha: sha,
	head_branch: "feature",
	head_repository: {full_name: "contributor/mapsight"},
	run_attempt: 1,
};
const pull: Pull = {
	number: 123,
	state: "open",
	base: {ref: "main"},
	head: {sha, ref: "feature", repo: {full_name: "contributor/mapsight"}},
};

test("fork builds resolve against GitHub PR data without trusting artifact metadata", () => {
	assert.equal(deploymentTarget(run, [pull]), "pr-123");
});

test("closed, superseded, or unrelated builds cannot select a preview", () => {
	for (const candidate of [
		{...pull, state: "closed"},
		{...pull, head: {...pull.head, sha: "b".repeat(40)}},
		{
			...pull,
			head: {...pull.head, repo: {full_name: "someone-else/mapsight"}},
		},
		{...pull, base: {ref: "another-base"}},
	])
		assert.equal(deploymentTarget(run, [candidate]), undefined);
	assert.equal(
		deploymentTarget({...run, conclusion: "failure"}, [pull]),
		undefined,
	);
	assert.equal(
		deploymentTarget({...run, path: ".github/workflows/unrelated.yml"}, [
			pull,
		]),
		undefined,
	);
});

test("the showcase accepts only a successful build of the current main commit", () => {
	const main = {
		...run,
		event: "push",
		head_branch: "main",
		head_repository: {full_name: "open-mapsight/mapsight"},
	};
	assert.equal(deploymentTarget(main, [], sha), "main");
	assert.equal(deploymentTarget(main, [], "b".repeat(40)), undefined);
	assert.equal(
		deploymentTarget({...main, head_branch: "feature"}, [], sha),
		undefined,
	);
});
