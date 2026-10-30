import {StrictMode, Suspense} from "react";
import {type Root, hydrateRoot} from "react-dom/client";
import {renderToString} from "react-dom/server";
import {useSelector} from "react-redux";

import {act, cleanup} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import App from "../components/app";
import AppContext from "../components/helping/app-context";
import Instance from "../components/instance";
import {create} from "../index";
import createViewsPlugin from "../plugins/browser/views";
import {setViewBreakpoints} from "../store/actions";
import {viewSelector} from "../store/selectors";
import type {
	CreateOptions,
	MapsightUiRenderer,
	MapsightUiRendererProps,
} from "../types";
import browserDomRenderer from "./browser-dom";

const config = {map: {layers: {}}};
const uiState = {
	view: "desktop" as const,
	map: {show: false},
	list: {show: false},
};
const roots: Root[] = [];

function ViewProbe() {
	const view = useSelector(viewSelector);
	return <button type="button">{view}</button>;
}
const components = {AppWrapperStart: ViewProbe};

function serverApp() {
	const context = create(
		null,
		vi.fn(() => undefined),
		config,
		{
			uiState,
			components,
			validateConfig: false,
			renderer: (_container, props) =>
				renderToString(
					<AppContext {...props}>
						<App />
					</AppContext>,
				),
		},
	);
	const container = document.createElement("div");
	container.innerHTML = context.render?.({});
	document.body.append(container);
	return {
		container,
		state: JSON.parse(JSON.stringify(context.store?.getState())),
	};
}

afterEach(async () => {
	await act(async () => {
		await Promise.resolve();
		for (const root of roots.splice(0)) root.unmount();
	});
	cleanup();
	document.body.replaceChildren();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe("app hydration", () => {
	it.each(["default", "host"])(
		"runs %s renderer plugins after commit and preserves the desktop nodes",
		async (kind) => {
			const errors = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			vi.stubGlobal("innerWidth", 1280);
			const {container, state} = serverApp();
			const wrapper = container.querySelector(".ms3-wrapper");
			const button = container.querySelector("button")!;
			button.focus();
			const afterRender = vi.fn(() => {
				expect(container.querySelector(".ms3-wrapper")).toBe(wrapper);
				expect(button.textContent).toBe("desktop");
			});
			const hostRenderer: MapsightUiRenderer<Root> = (target, props) => {
				const onCommit = props.deferCommit?.();
				const root = hydrateRoot(
					target!,
					<AppContext {...props} onCommit={onCommit}>
						<App />
					</AppContext>,
					{onRecoverableError: errors},
				);
				roots.push(root);
				return root;
			};
			const context = create(
				container,
				vi.fn(() => undefined),
				config,
				{
					reHydratedState: state,
					components,
					renderer:
						kind === "default" ? browserDomRenderer : hostRenderer,
					validateConfig: false,
					plugins: [
						["assertCommit", {afterRender}],
						["views", createViewsPlugin()],
					],
				},
			);
			vi.stubGlobal("innerWidth", 390);
			window.dispatchEvent(new Event("resize"));
			expect(context.store?.getState().app.view).toBe("desktop");
			await act(async () => {
				await Promise.resolve();
				const ref = context.render?.({});
				if (kind === "default") roots.push(ref);
				expect(context.hasRendered).toBe(false);
				expect(afterRender).not.toHaveBeenCalled();
			});
			expect(context.hasRendered).toBe(true);
			expect(afterRender).toHaveBeenCalledOnce();
			expect(context.store?.getState().app.view).toBe("mobile");
			expect(container.querySelector(".ms3-wrapper")).toBe(wrapper);
			expect(container.querySelector("button")).toBe(button);
			expect(button.textContent).toBe("mobile");
			expect(document.activeElement).toBe(button);
			expect(errors).not.toHaveBeenCalled();
		},
	);

	it.each(["afterCreate", "afterSchedule"])(
		"pins the SSR snapshot despite an immediate %s breakpoint dispatch",
		async (timing) => {
			const errors = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			const {container, state} = serverApp();
			const button = container.querySelector("button");
			const firstCommit = vi.fn(() =>
				expect(button?.textContent).toBe("desktop"),
			);
			const context = create(
				container,
				vi.fn(() => undefined),
				config,
				{
					reHydratedState: state,
					components,
					validateConfig: false,
					plugins: [
						[
							"earlyUpdate",
							{
								afterCreate(context) {
									if (timing === "afterCreate")
										context.store?.dispatch(
											setViewBreakpoints(["mobile"]),
										);
								},
							},
						],
					],
					renderer: (target, props) => {
						const commit = props.deferCommit?.();
						const root = hydrateRoot(
							target!,
							<AppContext
								{...props}
								onCommit={() => {
									firstCommit();
									commit?.();
								}}
							>
								<App />
							</AppContext>,
							{onRecoverableError: errors},
						);
						roots.push(root);
					},
				},
			);
			await act(async () => {
				await Promise.resolve();
				context.render?.({});
				if (timing === "afterSchedule")
					context.store?.dispatch(setViewBreakpoints(["mobile"]));
			});
			expect(firstCommit).toHaveBeenCalledOnce();
			expect(container.querySelector("button")).toBe(button);
			expect(button?.textContent).toBe("mobile");
			expect(errors).not.toHaveBeenCalled();
		},
	);

	it("hydrates Instance, runs its plugins once under StrictMode, and retains its store on child updates", async () => {
		const errors = vi.spyOn(console, "error").mockImplementation(() => {});
		const afterRender = vi.fn();
		const styleFunction = vi.fn(() => undefined);
		const options: CreateOptions = {
			uiState,
			validateConfig: false,
			plugins: [["commit", {afterRender}]],
		};
		const server = (
			<Instance
				baseMapsightConfig={config}
				styleFunction={styleFunction}
				createOptions={{...options, plugins: []}}
			>
				<ViewProbe />
			</Instance>
		);
		const container = document.createElement("div");
		container.innerHTML = renderToString(server);
		document.body.append(container);
		const button = container.querySelector("button");
		const clientOptions: CreateOptions = {
			...options,
			plugins: [
				["commit", {afterRender}],
				["views", createViewsPlugin()],
			],
		};
		vi.stubGlobal("innerWidth", 390);
		const client = (
			<StrictMode>
				<Instance
					baseMapsightConfig={config}
					styleFunction={styleFunction}
					createOptions={clientOptions}
				>
					<ViewProbe />
				</Instance>
			</StrictMode>
		);
		await act(async () => {
			await Promise.resolve();
			roots.push(
				hydrateRoot(container, client, {onRecoverableError: errors}),
			);
		});
		expect(container.querySelector("button")).toBe(button);
		expect(button?.textContent).toBe("mobile");
		expect(afterRender).toHaveBeenCalledOnce();
		await act(async () => {
			await Promise.resolve();
			roots[0]!.render(
				<StrictMode>
					<Instance
						baseMapsightConfig={config}
						styleFunction={styleFunction}
						createOptions={clientOptions}
					>
						<ViewProbe />
						<span>updated child</span>
					</Instance>
				</StrictMode>,
			);
		});
		expect(container.querySelector("button")).toBe(button);
		expect(button?.textContent).toBe("mobile");
		expect(afterRender).toHaveBeenCalledTimes(2);
		expect(errors).not.toHaveBeenCalled();
	});

	it("keeps serverState available for descendants that hydrate after the root commits", async () => {
		const errors = vi.spyOn(console, "error").mockImplementation(() => {});
		let blocked = false;
		let release!: () => void;
		const pending = new Promise<void>((resolve) => {
			release = resolve;
		});
		function DeferredProbe() {
			// eslint-disable-next-line @typescript-eslint/only-throw-error -- React Suspense waits for this promise.
			if (blocked) throw pending;
			return <ViewProbe />;
		}
		const tree = (
			props: MapsightUiRendererProps,
			onCommit?: () => void,
		) => (
			<AppContext {...props} onCommit={onCommit}>
				<Suspense fallback={null}>
					<DeferredProbe />
				</Suspense>
			</AppContext>
		);
		const server = create(
			null,
			vi.fn(() => undefined),
			config,
			{
				uiState,
				validateConfig: false,
				renderer: (_container, props) => renderToString(tree(props)),
			},
		);
		const container = document.createElement("div");
		container.innerHTML = server.render?.({});
		document.body.append(container);
		const button = container.querySelector("button");
		blocked = true;
		const afterRender = vi.fn((context) =>
			context.store.dispatch(setViewBreakpoints(["mobile"])),
		);
		const client = create(
			container,
			vi.fn(() => undefined),
			config,
			{
				reHydratedState: JSON.parse(
					JSON.stringify(server.store?.getState()),
				),
				validateConfig: false,
				plugins: [["viewport", {afterRender}]],
				renderer: (target, props) => {
					const commit = props.deferCommit?.();
					roots.push(
						hydrateRoot(target!, tree(props, commit), {
							onRecoverableError: errors,
						}),
					);
				},
			},
		);
		await act(async () => {
			client.render?.({});
			await Promise.resolve();
		});
		expect(afterRender).toHaveBeenCalledOnce();
		expect(button?.textContent).toBe("desktop");
		await act(async () => {
			blocked = false;
			release();
			await pending;
		});
		expect(container.querySelector("button")).toBe(button);
		expect(button?.textContent).toBe("mobile");
		expect(errors).not.toHaveBeenCalled();
	});

	it("commits client-only renders and reuses the default root for later renders", async () => {
		const errors = vi.spyOn(console, "error").mockImplementation(() => {});
		const container = document.createElement("div");
		document.body.append(container);
		const afterRender = vi.fn(() =>
			expect(container.querySelector("button")).not.toBeNull(),
		);
		const context = create(
			container,
			vi.fn(() => undefined),
			config,
			{
				uiState,
				components,
				validateConfig: false,
				renderer: browserDomRenderer,
				plugins: [["commit", {afterRender}]],
			},
		);
		await act(async () => {
			roots.push(context.render?.({}));
			expect(afterRender).not.toHaveBeenCalled();
			await Promise.resolve();
		});
		const button = container.querySelector("button");
		await act(async () => {
			expect(context.render?.({})).toBe(roots[0]);
			await Promise.resolve();
		});
		expect(afterRender).toHaveBeenCalledTimes(2);
		expect(container.querySelector("button")).toBe(button);
		expect(errors).not.toHaveBeenCalled();
	});

	it("coalesces explicit renders scheduled before the first hydration commits", async () => {
		const errors = vi.spyOn(console, "error").mockImplementation(() => {});
		const {container, state} = serverApp();
		const button = container.querySelector("button");
		const afterRender = vi.fn();
		const context = create(
			container,
			vi.fn(() => undefined),
			config,
			{
				reHydratedState: state,
				components,
				validateConfig: false,
				renderer: browserDomRenderer,
				plugins: [["commit", {afterRender}]],
			},
		);
		await act(async () => {
			roots.push(context.render?.({}));
			expect(context.render?.({})).toBe(roots[0]);
			expect(context.render?.({})).toBe(roots[0]);
			expect(context.hasRendered).toBe(false);
			await Promise.resolve();
		});
		expect(context.hasRendered).toBe(true);
		expect(afterRender).toHaveBeenCalledOnce();
		expect(container.querySelector("button")).toBe(button);
		expect(errors).not.toHaveBeenCalled();
	});
});
