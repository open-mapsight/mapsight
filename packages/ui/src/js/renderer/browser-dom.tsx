import type {ReactNode} from "react";
import {type Root, createRoot, hydrateRoot} from "react-dom/client";

import App from "../components/app";
import AppContext from "../components/helping/app-context";
import type {MapsightUiRenderer} from "../types";

type RenderedRoot = {
	root: Root;
	hasCommitted: boolean;
	pendingApp?: ReactNode;
};
const roots = new WeakMap<HTMLElement, RenderedRoot>();

/**
 * Browser renderer (DOM) with re-hydration
 */
const mapsightUiBrowserDomRenderer: MapsightUiRenderer<Root | undefined> = (
	container,
	props,
	hydrate = false,
) => {
	if (!container) return;

	let renderedRoot = roots.get(container);
	const commit = props.deferCommit?.();
	const onCommit = () => {
		if (renderedRoot) {
			renderedRoot.hasCommitted = true;
			// An early root.render() would interrupt hydration. Coalesce explicit
			// renders until the first tree has actually committed.
			if (renderedRoot.pendingApp) {
				const pendingApp = renderedRoot.pendingApp;
				renderedRoot.pendingApp = undefined;
				renderedRoot.root.render(pendingApp);
			}
		}
		commit?.();
	};
	const app = (
		<AppContext {...props} onCommit={onCommit}>
			<App />
		</AppContext>
	);

	if (renderedRoot) {
		if (renderedRoot.hasCommitted) {
			renderedRoot.root.render(app);
		} else {
			renderedRoot.pendingApp = app;
		}
		return renderedRoot.root;
	}
	const root = hydrate ? hydrateRoot(container, app) : createRoot(container);
	renderedRoot = {root, hasCommitted: false};
	roots.set(container, renderedRoot);
	if (!hydrate) root.render(app);
	return root;
};

export default mapsightUiBrowserDomRenderer;
