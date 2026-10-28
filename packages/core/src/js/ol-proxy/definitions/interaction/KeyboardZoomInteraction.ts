import KeyboardZoom from "ol/interaction/KeyboardZoom";

import runWithMotionPreference from "@/lib/map/lib/runWithMotionPreference";
import type {Definition} from "@/ol-proxy";

import base from "./_base";

// Keep OL's public keyboard semantics and caller options; select the duration
// per key event because OL exposes no public duration setter.
class MotionAwareKeyboardZoom extends KeyboardZoom {
	private readonly instant: KeyboardZoom;
	constructor(options?: ConstructorParameters<typeof KeyboardZoom>[0]) {
		super(options);
		this.instant = new KeyboardZoom({...options, duration: 0});
	}
	override handleEvent(...args: Parameters<KeyboardZoom["handleEvent"]>) {
		let propagate = true;
		runWithMotionPreference(args[0].map, (reduced) => {
			propagate = reduced
				? this.instant.handleEvent(...args)
				: super.handleEvent(...args);
		});
		return propagate;
	}
}

type Ctor = typeof KeyboardZoom;

export default {
	type: "KeyboardZoomInteraction",
	Constructor: MotionAwareKeyboardZoom,
	optionMap: {
		...base.optionMap,
	},
	initialOptionMap: {
		...base.initialOptionMap,
		condition: "condition",
		duration: "duration",
		delta: "delta",
	},
} satisfies Definition<Ctor>;
