import {JSDOM} from "jsdom";

// browser simulation
export const navigator = {userAgent: "blubb"};
export const requestAnimationFrame = setImmediate;

// shim browser environment for openlayers
const dom = new JSDOM("", {
	pretendToBeVisual: true,
	url: "https://[::1]/",
	contentType: "text/html",
});

export const window = dom.window;
export const document = dom.window.document;
