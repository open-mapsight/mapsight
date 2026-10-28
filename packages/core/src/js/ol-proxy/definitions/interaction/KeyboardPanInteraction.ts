import KeyboardPan from "ol/interaction/KeyboardPan";

import {getMotionPreference} from "@/lib/map/lib/runWithMotionPreference";
import type {Definition} from "@/ol-proxy";

import base from "./_base";

// Keep OL's public keyboard semantics and caller options; select the duration
// per key event because OL exposes no public duration setter.
class MotionAwareKeyboardPan extends KeyboardPan {
	private readonly instant: KeyboardPan;
	constructor(options?: ConstructorParameters<typeof KeyboardPan>[0]) {
		super(options);
		this.instant = new KeyboardPan({...options, duration: 0});
	}
	override handleEvent(...args: Parameters<KeyboardPan["handleEvent"]>) {
		return getMotionPreference()?.matches
			? this.instant.handleEvent(...args)
			: super.handleEvent(...args);
	}
}

type Ctor = typeof KeyboardPan;

export default {
	type: "KeyboardPanInteraction",
	Constructor: MotionAwareKeyboardPan,
	optionMap: {
		...base.optionMap,
	},
	initialOptionMap: {
		...base.initialOptionMap,
		condition: "condition",
		duration: "duration",
		pixelDelta: "pixelDelta",
	},
} satisfies Definition<Ctor>;
