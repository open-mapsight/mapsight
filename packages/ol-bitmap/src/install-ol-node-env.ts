/**
 * Install the OpenLayers worker / OffscreenCanvas globals before any `ol` import.
 *
 * OL 10.10+ can target a canvas when `WORKER_OFFSCREEN_CANVAS` is true
 * (`self instanceof WorkerGlobalScope` and `OffscreenCanvas`). That flag is
 * evaluated when `ol/has.js` first loads.
 *
 * This module is a process-wide side effect. Import `@mapsight/ol-bitmap`
 * before `ol` in the same Node process.
 */
import {Canvas, Image as NapiImage, loadImage} from "@napi-rs/canvas";

const INSTALLED = Symbol.for("mapsight.ol-bitmap.env");

type Listener = (event: Event) => void;

function installDomEvents(target: object): void {
	const listeners = new Map<string, Set<Listener>>();
	Object.assign(target, {
		addEventListener(type: string, listener: Listener) {
			if (!listeners.has(type)) {
				listeners.set(type, new Set());
			}
			listeners.get(type)?.add(listener);
		},
		removeEventListener(type: string, listener: Listener) {
			listeners.get(type)?.delete(listener);
		},
		dispatchEvent(event: Event) {
			for (const listener of [...(listeners.get(event.type) ?? [])]) {
				listener.call(target, event);
			}
			return true;
		},
	});
}

class CanvasGradient {}
class CanvasPattern {}

class WorkerGlobalScope {
	static [Symbol.hasInstance](instance: unknown): boolean {
		return instance === globalThis || instance === globalThis.self;
	}
}

class OffscreenCanvas extends Canvas {
	style: Record<string, string> = {};

	constructor(width = 300, height = 150) {
		super(width, height);
		this.style = {};
		installDomEvents(this);
	}

	declare addEventListener: (type: string, listener: Listener) => void;
	declare dispatchEvent: (event: Event) => boolean;
	declare removeEventListener: (type: string, listener: Listener) => void;
}

class Image extends NapiImage {
	constructor(width?: number, height?: number) {
		if (width !== undefined && height !== undefined) {
			super(width, height);
		} else {
			super();
		}
		installDomEvents(this);
		this.onload = () => {
			this.dispatchEvent(new Event("load"));
		};
		this.onerror = () => {
			this.dispatchEvent(new Event("error"));
		};
	}

	declare addEventListener: (type: string, listener: Listener) => void;
	declare dispatchEvent: (event: Event) => boolean;
	declare removeEventListener: (type: string, listener: Listener) => void;
}

async function createImageBitmapPolyfill(
	source: ImageBitmapSource | Blob | Buffer | Canvas | NapiImage,
): Promise<Canvas | ImageBitmapSource | NapiImage> {
	if (typeof Blob !== "undefined" && source instanceof Blob) {
		return loadImage(Buffer.from(await source.arrayBuffer()));
	}
	if (Buffer.isBuffer(source)) {
		return loadImage(source);
	}
	return source;
}

function installOlNodeEnv(): void {
	const host = globalThis as typeof globalThis & {
		[INSTALLED]?: true;
	};

	if (host[INSTALLED]) {
		return;
	}

	const frames = new Map<number, NodeJS.Immediate>();
	let nextFrameId = 1;
	Object.assign(globalThis, {
		WorkerGlobalScope,
		OffscreenCanvas,
		CanvasGradient,
		CanvasPattern,
		Image,
		HTMLImageElement: Image,
		self: globalThis,
		window: globalThis,
		devicePixelRatio: 1,
		fonts: {check: () => true},
		createImageBitmap: createImageBitmapPolyfill,
		addEventListener: host.addEventListener ?? (() => {}),
		removeEventListener: host.removeEventListener ?? (() => {}),
		requestAnimationFrame: (cb: FrameRequestCallback) => {
			const id = nextFrameId;
			nextFrameId += 1;
			frames.set(
				id,
				setImmediate(() => {
					frames.delete(id);
					cb(Date.now());
				}),
			);
			return id;
		},
		cancelAnimationFrame: (id: number) => {
			const immediate = frames.get(id);
			if (immediate) {
				clearImmediate(immediate);
				frames.delete(id);
			}
		},
	});
	host[INSTALLED] = true;
}

installOlNodeEnv();

export {Image, OffscreenCanvas, installOlNodeEnv};
