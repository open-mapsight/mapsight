import {ensureNonNullable} from "../../nonNullable.ts";

export default function loadJS(src: string, cb: () => void) {
	const head = ensureNonNullable(document.getElementsByTagName("head")[0]);
	const script = document.createElement("script");
	script.type = "text/javascript";
	script.async = true;
	script.defer = true;
	script.src = src;

	let done = false;

	script.onload = function () {
		if (!done) {
			done = true;
			if (typeof cb === "function") {
				cb();
			}
		}
	};

	head.appendChild(script);
}
