/** Minimal jsdom stubs for OpenLayers map controller boot in Vitest. */
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverStub;
