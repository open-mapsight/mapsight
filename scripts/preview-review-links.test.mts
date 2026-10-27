import assert from "node:assert/strict";
import {test} from "node:test";

import {PreviewProject} from "./preview-project.mts";
import {
	type GitHub,
	renderReview,
	reviewLinks,
	runtimeImports,
	showcaseRoutes,
	updateReview,
} from "./preview-review-links.mts";

const sha = "a".repeat(40);
const mainSha = "b".repeat(40);
const origin = "https://pr-123.preview.open-mapsight.org";
const marker = "<!-- mapsight-preview-review-links -->";

function sources(): Map<string, string> {
	return new Map([
		[
			"apps/showcase/package.json",
			JSON.stringify({
				name: "@mapsight/showcase",
				mapsight: {
					preview: {
						guides: "guides.json",
						generated: [
							{
								inputs: ["src/mock-service-worker.ts"],
								consumers: [
									"src/count-aggregator/headless.tsx",
								],
							},
						],
					},
				},
			}),
		],
		[
			"apps/showcase/guides.json",
			JSON.stringify({
				router: "src/app.tsx",
				pages: {
					FullPage: {
						label: "Full UI",
						check: "Select a feature",
						sample: true,
						scenarios: ["list"],
					},
					CatalogPage: {label: "Icon catalog", check: "Browse icons"},
					HeadlessPage: {
						label: "Headless count aggregator",
						check: "Load daily values",
						note: "Count-aggregator demos use local mock data.",
					},
				},
				scenarios: {
					list: {
						modules: ["@mapsight/ui/components/feature-list"],
						check: "Navigate with Tab and arrow keys",
					},
				},
				deprioritize: ["@mapsight/ui/helpers/i18n"],
			}),
		],
		[
			"apps/showcase/src/index.html",
			`<script src="./main.tsx"></script><link href="./global.css"><link href="./msui.scss">`,
		],
		["apps/showcase/src/main.tsx", "import './app.tsx';"],
		["apps/showcase/src/global.css", "body {}"],
		["apps/showcase/src/mock-service-worker.ts", "export {}"],
		[
			"packages/ui/tsconfig.json",
			JSON.stringify({
				compilerOptions: {rootDir: "src/js", outDir: "dist"},
			}),
		],
		[
			"packages/ui/src/js/helpers/i18n/index.ts",
			"export * from './en.ts';",
		],
		["packages/ui/src/js/helpers/i18n/en.ts", "export const text='Name';"],
		[
			"packages/traffic-style/package.json",
			JSON.stringify({
				name: "@mapsight/traffic-style",
				publishConfig: {directory: "dist"},
				exports: {"./icon-meta": "./lib/icon-meta.js"},
				mapsight: {
					preview: {
						generated: [
							{
								inputs: ["src/icons/"],
								consumers: ["src/lib/icon-meta.ts"],
							},
						],
					},
				},
			}),
		],
		[
			"packages/traffic-style/tsconfig.lib.json",
			JSON.stringify({compilerOptions: {rootDir: "src", outDir: "dist"}}),
		],
		["packages/traffic-style/src/lib/icon-meta.ts", "export {}"],
		["packages/traffic-style/src/icons/bus.svg", "<svg/>"],
		[
			"apps/showcase/src/app.tsx",
			`
			import {FullPage} from './pages/full.tsx';
			import {CatalogPage} from './icons/catalog-page.tsx';
			import {HeadlessPage} from './count-aggregator/headless.tsx';
			import {Landing} from './pages/landing.tsx';
			<Routes><Route element={<Layout />}>
			<Route index element={<Landing />} />
			<Route path="ui/full" element={<FullPage />} />
			<Route path="icons/catalog" element={<CatalogPage />} />
			<Route path="count-aggregator/headless" element={<HeadlessPage />} />
			<Route path="old" element={<Navigate to="/" />} />
			<Route path="record/:id" element={<FullPage />} />
			</Route></Routes>`,
		],
		[
			"apps/showcase/src/pages/full.tsx",
			`import App from '@mapsight/ui/components/app';`,
		],
		[
			"apps/showcase/src/pages/landing.tsx",
			`import {FullPage} from './full.tsx';`,
		],
		[
			"apps/showcase/src/icons/catalog-page.tsx",
			`import './grid.tsx'; import './styles.css'; import '@mapsight/traffic-style/icon-meta';`,
		],
		["apps/showcase/src/icons/grid.tsx", "export {}"],
		["apps/showcase/src/icons/styles.css", "body {}"],
		["apps/showcase/src/count-aggregator/headless.tsx", "export {}"],
		[
			"packages/ui/package.json",
			JSON.stringify({
				name: "@mapsight/ui",
				exports: {
					"./*": {types: "./dist/*.d.ts", default: "./dist/*.js"},
				},
			}),
		],
		[
			"packages/ui/src/js/components/app.tsx",
			`export {default} from './feature-list/index.js';`,
		],
		[
			"packages/ui/src/js/components/feature-list/index.tsx",
			"export default function List() {}",
		],
	]);
}

test("runtime imports include barrels, literal dynamic imports, CSS and assets but exclude type-only edges", () => {
	assert.deepEqual(
		runtimeImports(
			"sample.tsx",
			`
		// import './comment';
		const text = "import './string'";
		import type {Thing} from './types';
		import {type More} from './more-types';
		export type {EvenMore} from './exported-types';
		import {type Type, value} from './mixed';
		import './styles.css';
		export {default} from './barrel.js';
		import('./lazy.tsx');
		import(variable);
		new URL('./image.svg', import.meta.url);
	`,
		),
		["./mixed", "./styles.css", "./barrel.js", "./lazy.tsx", "./image.svg"],
	);
});

test("routes come from literal mounted pages; redirects and unresolved parameters are omitted", () => {
	assert.deepEqual(
		showcaseRoutes(sources()).map((route) => route.path),
		["/", "/ui/full", "/icons/catalog", "/count-aggregator/headless"],
	);
});

test("new workspace packages, inherited emit roots, publish directories and aliases need no bot mapping", () => {
	const src = sources();
	src.set(
		"extensions/new-kit/package.json",
		JSON.stringify({
			name: "@example/new-kit",
			publishConfig: {directory: "release"},
			exports: {".": {import: "./modules/start.js"}},
		}),
	);
	src.set(
		"extensions/new-kit/tsconfig.json",
		JSON.stringify({
			compilerOptions: {
				rootDir: "library",
				paths: {"#local/*": ["library/*"]},
			},
		}),
	);
	src.set(
		"extensions/new-kit/tsconfig.build.json",
		JSON.stringify({
			extends: "./tsconfig.json",
			compilerOptions: {outDir: "release/modules"},
		}),
	);
	src.set(
		"extensions/new-kit/library/start.ts",
		"export * from '#local/detail.js';",
	);
	src.set(
		"extensions/new-kit/library/detail.ts",
		"export const changed = 1;",
	);
	src.set("apps/showcase/src/icons/grid.tsx", "import '@example/new-kit';");
	assert.deepEqual(
		reviewLinks(src, [
			{filename: "extensions/new-kit/library/detail.ts"},
		]).map((link) => link.path),
		["/icons/catalog"],
	);
});

test("generated outputs connect new asset packages to actual consumers without classifying package names", () => {
	const src = sources();
	src.set(
		"assets/other-pack/package.json",
		JSON.stringify({
			name: "@example/other-pack",
			exports: {".": "./entry.ts"},
			mapsight: {
				preview: {
					generated: [{inputs: ["artwork/"], outputs: ["built/"]}],
				},
			},
		}),
	);
	src.set("assets/other-pack/entry.ts", "export * from './built/icons.js';");
	src.set("assets/other-pack/artwork/new.svg", "<svg/>");
	src.set(
		"apps/showcase/src/icons/grid.tsx",
		"import '@example/other-pack';",
	);
	const project = new PreviewProject(src);
	project.validate();
	assert.deepEqual(
		reviewLinks(src, [{filename: "assets/other-pack/artwork/new.svg"}]).map(
			(link) => link.path,
		),
		["/icons/catalog"],
	);
});

test("guide labels and scenarios follow a renamed URL without a second route-path edit", () => {
	const src = sources();
	src.set(
		"apps/showcase/src/app.tsx",
		src
			.get("apps/showcase/src/app.tsx")!
			.replace('path="ui/full"', 'path="examples/list"'),
	);
	new PreviewProject(src).validate();
	const [link] = reviewLinks(src, [
		{filename: "packages/ui/src/js/components/feature-list/index.tsx"},
	]);
	assert.equal(link!.path, "/examples/list");
	assert.equal(link!.label, "Full UI");
	assert.match(link!.check, /arrow keys/);
});

test("validation fails on stale guide components, scenarios, generated inputs, outputs and consumers", () => {
	for (const mutate of [
		(src: Map<string, string>) =>
			src.set("apps/showcase/src/app.tsx", "export {}"),
		(src: Map<string, string>) =>
			src.delete("packages/ui/src/js/components/feature-list/index.tsx"),
		(src: Map<string, string>) =>
			src.delete("packages/traffic-style/src/icons/bus.svg"),
		(src: Map<string, string>) =>
			src.delete("apps/showcase/src/count-aggregator/headless.tsx"),
		(src: Map<string, string>) =>
			src.set(
				"packages/traffic-style/package.json",
				JSON.stringify({
					name: "@mapsight/traffic-style",
					mapsight: {
						preview: {
							generated: [
								{
									inputs: ["src/icons/"],
									outputs: ["abandoned/"],
								},
							],
						},
					},
				}),
			),
	]) {
		const src = sources();
		mutate(src);
		assert.throws(
			() => new PreviewProject(src).validate(),
			/Preview router|Review guide|scenario|Generated/i,
		);
	}
});

test("older PR snapshots use trusted review metadata while preserving their own export mappings", () => {
	const metadata = sources();
	const old = sources();
	old.set(
		"apps/showcase/package.json",
		JSON.stringify({name: "@mapsight/showcase"}),
	);
	old.delete("apps/showcase/guides.json");
	const links = reviewLinks(
		old,
		[{filename: "packages/ui/src/js/components/feature-list/index.tsx"}],
		metadata,
	);
	assert.equal(links[0]!.label, "Full UI");
	assert.match(links[0]!.check, /arrow keys/);
});

test("workspace exports trace a component to its screen and stop before the landing page", () => {
	const links = reviewLinks(sources(), [
		{filename: "packages/ui/src/js/components/feature-list/index.tsx"},
	]);
	assert.deepEqual(
		links.map((link) => link.path),
		["/ui/full"],
	);
	assert.match(links[0]!.check, /Tab and arrow keys/);
	assert.equal(
		links[0]!.evidence,
		"packages/ui/src/js/components/feature-list/index.tsx",
	);
});

test("Sass partials, exact workspace subpaths and core aliases resolve to their consumers", () => {
	const src = sources();
	src.set(
		"apps/showcase/src/msui.scss",
		'@use "~@mapsight/ui/src/scss/default";',
	);
	src.set("packages/ui/src/scss/_default.scss", '@use "blocks/list";');
	src.set("packages/ui/src/scss/blocks/_list.scss", ".list {}");
	assert.deepEqual(
		reviewLinks(src, [
			{filename: "packages/ui/src/scss/blocks/_list.scss"},
		]).map((link) => link.path),
		["/ui/full"],
	);
	src.set(
		"packages/ui/package.json",
		JSON.stringify({
			name: "@mapsight/ui",
			exports: {
				"./components/app": {default: "./dist/components/app.js"},
			},
		}),
	);
	src.set(
		"packages/ui/src/js/components/app.tsx",
		"import '@mapsight/core';",
	);
	src.set(
		"packages/core/package.json",
		JSON.stringify({
			name: "@mapsight/core",
			exports: {".": {import: "./dist/index.js"}},
		}),
	);
	src.set(
		"packages/core/src/js/index.ts",
		"export {value} from '@/helper.js';",
	);
	src.set("packages/core/src/js/helper.ts", "export const value = 1;");
	src.set(
		"packages/core/tsconfig.json",
		JSON.stringify({
			compilerOptions: {
				rootDir: "src/js",
				outDir: "dist",
				paths: {"@/*": ["./src/js/*"]},
			},
		}),
	);
	assert.deepEqual(
		reviewLinks(src, [{filename: "packages/core/src/js/helper.ts"}]).map(
			(link) => link.path,
		),
		["/ui/full"],
	);
});

test("renames use their current filename and shared changes have a bounded representative sample", () => {
	const src = sources();
	src.set("apps/showcase/src/icons/renamed.tsx", "export {};");
	src.set("apps/showcase/src/icons/grid.tsx", "import './renamed.tsx';");
	assert.deepEqual(
		reviewLinks(src, [
			{
				filename: "apps/showcase/src/icons/renamed.tsx",
				previous_filename: "apps/showcase/src/icons/old.tsx",
			},
		]).map((link) => link.path),
		["/icons/catalog"],
	);
	const shared = reviewLinks(src, [
		{filename: "apps/showcase/src/global.css"},
	]);
	assert.ok(shared.length <= 3);
	assert.ok(shared.every((link) => link.distance === 100));
});

test("direct and independent changes both get links without filling unrelated screens", () => {
	const links = reviewLinks(sources(), [
		{filename: "apps/showcase/src/icons/grid.tsx"},
		{filename: "apps/showcase/src/count-aggregator/headless.tsx"},
	]);
	assert.deepEqual(
		links.map((link) => link.path),
		["/count-aggregator/headless", "/icons/catalog"],
	);
});

test("docs, tests, unused modules and unsupported server packages produce no screen links", () => {
	for (const filename of [
		"docs/example.md",
		"packages/ui/src/js/components/app.test.tsx",
		"packages/ssr-sidecar/src/server.ts",
		"packages/ui/src/js/unused.ts",
	]) {
		assert.deepEqual(reviewLinks(sources(), [{filename}]), []);
	}
});

test("specific UI changes take priority over locale-only impact on unrelated screens", () => {
	const src = sources();
	src.set(
		"packages/ui/src/js/helpers/i18n/en.ts",
		"export const text = 'Name';",
	);
	src.set(
		"apps/showcase/src/icons/grid.tsx",
		"import '@mapsight/ui/helpers/i18n/en';",
	);
	const links = reviewLinks(src, [
		{filename: "packages/ui/src/js/components/feature-list/index.tsx"},
		{filename: "packages/ui/src/js/helpers/i18n/en.ts"},
	]);
	assert.deepEqual(
		links.map((link) => link.path),
		["/ui/full"],
	);
});

test("generated icons and service worker changes link only to available relevant routes", () => {
	assert.deepEqual(
		reviewLinks(sources(), [
			{filename: "packages/traffic-style/src/icons/bus.svg"},
		]).map((link) => link.path),
		["/icons/catalog"],
	);
	assert.deepEqual(
		reviewLinks(sources(), [
			{filename: "apps/showcase/src/mock-service-worker.ts"},
		]).map((link) => link.path),
		["/count-aggregator/headless"],
	);
	const withoutCatalog = sources();
	withoutCatalog.delete("apps/showcase/src/icons/catalog-page.tsx");
	assert.deepEqual(
		reviewLinks(withoutCatalog, [
			{filename: "packages/traffic-style/src/icons/bus.svg"},
		]),
		[],
	);
});

test("comments provide exact deployed revision, comparable paths and mock-data context", () => {
	const links = reviewLinks(sources(), [
		{filename: "apps/showcase/src/icons/grid.tsx"},
		{filename: "apps/showcase/src/count-aggregator/headless.tsx"},
	]);
	const body = renderReview(
		123,
		sha,
		links,
		new Set(["/icons/catalog"]),
		true,
	);
	assert.ok(body.startsWith(marker));
	assert.match(body, /aaaaaaa/);
	assert.ok(body.includes(`${origin}/icons/catalog`));
	assert.match(body, /https:\/\/showcase.open-mapsight.org\/icons\/catalog/);
	assert.match(body, /New screen/);
	assert.match(body, /incomplete changed-file list/);
	assert.match(body, /local mock data/);
	assert.match(body, /not a verified reproduction/);
	assert.throws(() => renderReview(-1, sha, links, new Set()), /Invalid PR/);
});

interface FakeComment {
	id: number;
	body: string;
	user: {login: string; type: string};
}
function harness() {
	const state = {
		pull: {
			state: "open",
			head: {sha},
			base: {ref: "main"},
			changed_files: 1,
		},
		liveSha: sha as string | undefined,
		status: "success",
		url: origin,
		files: [{filename: "apps/showcase/src/icons/grid.tsx"}],
		comments: [] as FakeComment[],
		writes: [] as {endpoint: string; method: string; body: unknown}[],
	};
	const api: GitHub = <T,>(
		endpoint: string,
		method = "GET",
		body?: unknown,
	): Promise<T> => {
		if (method !== "GET") {
			state.writes.push({endpoint, method, body});
			return Promise.resolve({} as T);
		}
		let result: unknown;
		if (endpoint === "/pulls/123") result = structuredClone(state.pull);
		else if (endpoint.startsWith("/issues/123/comments?"))
			result = state.comments;
		else if (endpoint.startsWith("/deployments?"))
			result = [{id: 10, sha, environment: "preview/pr-123"}];
		else if (endpoint.startsWith("/deployments/10/statuses?"))
			result = [{state: state.status, environment_url: state.url}];
		else if (endpoint.startsWith("/pulls/123/files?")) result = state.files;
		else if (endpoint === "/commits/main") result = {sha: mainSha};
		else throw new Error(`Unexpected API: ${endpoint}`);
		return Promise.resolve(result as T);
	};
	const options = {
		number: 123,
		sha,
		write: true,
		api,
		sources,
		liveSha: (url: string) =>
			Promise.resolve(url === origin ? state.liveSha : mainSha),
	};
	return {state, options};
}
const own = (id: number, body = marker): FakeComment => ({
	id,
	body,
	user: {login: "github-actions[bot]", type: "Bot"},
});

test("dry runs never write; successful matching previews create one marked comment", async () => {
	const {state, options} = harness();
	const dry = await updateReview({...options, write: false});
	assert.match(dry, /Icon catalog/);
	assert.equal(state.writes.length, 0);
	const body = await updateReview(options);
	assert.deepEqual(state.writes, [
		{endpoint: "/issues/123/comments", method: "POST", body: {body}},
	]);
});

test("only this bot's marked comment is updated; duplicates are removed and unchanged bodies are skipped", async () => {
	const {state, options} = harness();
	state.comments = [
		own(1),
		own(2),
		{...own(3), user: {login: "someone-else", type: "User"}},
		own(4, "An unrelated bot comment"),
	];
	const body = await updateReview(options);
	assert.deepEqual(
		state.writes.map((write) => [write.endpoint, write.method]),
		[
			["/issues/comments/1", "PATCH"],
			["/issues/comments/2", "DELETE"],
		],
	);
	state.writes = [];
	state.comments = [own(1, body)];
	await updateReview(options);
	assert.equal(state.writes.length, 0);
});

test("failed, inactive, wrong-URL, outdated and unavailable deployments never change discussion", async () => {
	for (const mutate of [
		(state: ReturnType<typeof harness>["state"]) => {
			state.status = "failure";
		},
		(state: ReturnType<typeof harness>["state"]) => {
			state.status = "inactive";
		},
		(state: ReturnType<typeof harness>["state"]) => {
			state.url = "https://attacker.example";
		},
		(state: ReturnType<typeof harness>["state"]) => {
			state.pull.head.sha = mainSha;
		},
		(state: ReturnType<typeof harness>["state"]) => {
			state.liveSha = mainSha;
		},
		(state: ReturnType<typeof harness>["state"]) => {
			state.liveSha = undefined;
		},
	]) {
		const {state, options} = harness();
		mutate(state);
		await updateReview(options);
		assert.equal(state.writes.length, 0);
	}
});

test("a new head, PR closure or changed live preview during analysis prevents a write", async () => {
	for (const mutate of [
		(state: ReturnType<typeof harness>["state"]) => {
			state.pull.head.sha = mainSha;
		},
		(state: ReturnType<typeof harness>["state"]) => {
			state.pull.state = "closed";
		},
		(state: ReturnType<typeof harness>["state"]) => {
			state.liveSha = mainSha;
		},
	]) {
		const {state, options} = harness();
		await updateReview({
			...options,
			sources() {
				mutate(state);
				return sources();
			},
		});
		assert.equal(state.writes.length, 0);
	}
});

test("closed PRs and changes with no showcase coverage remove only obsolete marked comments", async () => {
	for (const closed of [true, false]) {
		const {state, options} = harness();
		state.comments = [own(1), own(2, "Other discussion")];
		if (closed) state.pull.state = "closed";
		else state.files = [{filename: "docs/guide.md"}];
		await updateReview(options);
		assert.deepEqual(
			state.writes.map((write) => [write.endpoint, write.method]),
			[["/issues/comments/1", "DELETE"]],
		);
	}
});

test("an incomplete file list cannot remove guidance and a reopening PR cannot lose its comment", async () => {
	const {state, options} = harness();
	state.comments = [own(1)];
	state.files = [];
	await updateReview(options);
	assert.equal(state.writes.length, 0);
	state.pull.state = "closed";
	const api: GitHub = <T,>(
		endpoint: string,
		method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
		body?: unknown,
	) => {
		const result = options.api<T>(endpoint, method, body);
		if (endpoint.startsWith("/issues/123/comments?"))
			state.pull.state = "open";
		return result;
	};
	await updateReview({...options, api});
	assert.equal(state.writes.length, 0);
});
