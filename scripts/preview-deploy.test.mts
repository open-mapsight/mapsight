import assert from "node:assert/strict";
import {Readable, Writable} from "node:stream";
import {test} from "node:test";

import {
	type BuildRun,
	type Pull,
	deploymentTarget,
	retryGitHubRequest,
	streamArchive,
} from "./preview-deploy.mts";

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

test("native stack layers deploy only when their stack targets main", () => {
	const layer = {...pull, base: {ref: "parent-pr"}};
	assert.equal(
		deploymentTarget(run, [{...layer, stack: {base: {ref: "main"}}}]),
		"pr-123",
	);
	for (const stack of [undefined, null, {base: {ref: "release"}}]) {
		assert.equal(deploymentTarget(run, [{...layer, stack}]), undefined);
	}
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

test("an archive read error propagates and stops the receiver", async () => {
	const failure = new Error("archive read failed");
	const source = new Readable({
		read() {
			this.destroy(failure);
		},
	});
	const destination = new Writable({
		write(_chunk, _encoding, callback) {
			callback();
		},
	});
	let stopped = false;
	await assert.rejects(
		streamArchive(source, destination, () => {
			stopped = true;
		}),
		failure,
	);
	assert.equal(stopped, true);
});

test("an early receiver exit is left to the SSH exit status", async () => {
	const source = Readable.from(["archive bytes"]);
	const destination = new Writable({
		write(_chunk, _encoding, callback) {
			callback(
				Object.assign(new Error("receiver closed"), {code: "EPIPE"}),
			);
		},
	});
	let stopped = false;
	await streamArchive(source, destination, () => {
		stopped = true;
	});
	assert.equal(stopped, false);
});

test("transient GitHub status/read failures are retried with a bounded backoff", async () => {
	let calls = 0;
	const pauses: number[] = [];
	const response = await retryGitHubRequest(
		() =>
			Promise.resolve(
				new Response("{}", {status: ++calls < 3 ? 500 : 200}),
			),
		true,
		(milliseconds) => {
			pauses.push(milliseconds);
			return Promise.resolve();
		},
	);
	assert.equal(response.status, 200);
	assert.equal(calls, 3);
	assert.deepEqual(pauses, [500, 1000]);
});

test("deployment creation is never replayed and authorization failures are not retried", async () => {
	for (const [retryable, status] of [
		[false, 500],
		[true, 403],
	] as const) {
		let calls = 0;
		const response = await retryGitHubRequest(
			() => {
				calls++;
				return Promise.resolve(new Response("{}", {status}));
			},
			retryable,
			() => {
				throw new Error("Should not pause");
			},
		);
		assert.equal(response.status, status);
		assert.equal(calls, 1);
	}
});

test("network failures stop after four attempts and preserve the original error", async () => {
	const failure = new Error("connection reset");
	let calls = 0;
	await assert.rejects(
		retryGitHubRequest(
			() => {
				calls++;
				return Promise.reject(failure);
			},
			true,
			() => Promise.resolve(),
		),
		failure,
	);
	assert.equal(calls, 4);
});
