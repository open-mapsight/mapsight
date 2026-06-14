import {Canvas, Image as CanvasImage} from "canvas";

import {
	document,
	requestAnimationFrame,
	window,
} from "@/env/ssr-simulated-browser";

globalThis.window = window as unknown as Window & typeof globalThis;
globalThis.document = document;
globalThis.requestAnimationFrame =
	requestAnimationFrame as unknown as typeof globalThis.requestAnimationFrame;
globalThis.HTMLElement = window.HTMLElement;
globalThis.MouseEvent = window.MouseEvent;
globalThis.getComputedStyle = window.getComputedStyle;

class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}

globalThis.ResizeObserver =
	ResizeObserverStub as unknown as typeof ResizeObserver;

if (!globalThis.ShadowRoot) {
	globalThis.ShadowRoot = class {} as typeof ShadowRoot;
}

if (!globalThis.CanvasPattern) {
	globalThis.CanvasPattern = class {} as typeof CanvasPattern;
}

// node-canvas backing store for OpenLayers vector rendering in Node tests / SSR prep.
globalThis.Image = CanvasImage as unknown as typeof Image;

const canvasProto = window.HTMLCanvasElement.prototype;
canvasProto.getContext = function getContext(
	this: HTMLCanvasElement,
	type: string,
	attributes?: CanvasRenderingContext2DSettings,
) {
	if (type === "2d") {
		const width = Number(this.width) || 300;
		const height = Number(this.height) || 150;
		const nodeCanvas = new Canvas(width, height);
		const context = nodeCanvas.getContext("2d", attributes);
		if (!context) {
			return null;
		}

		// Keep the jsdom element dimensions in sync with the backing canvas.
		Object.defineProperty(context, "canvas", {
			get: () => this,
		});

		return context as unknown as CanvasRenderingContext2D;
	}

	return null;
} as typeof canvasProto.getContext;
