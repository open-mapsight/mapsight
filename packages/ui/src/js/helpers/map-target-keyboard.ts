import type OlMap from "ol/Map";
import type View from "ol/View";

export type MapTargetKeyboardOptions = {
	/** Class set on the focused target while `showCrosshair()` holds. */
	crosshairClass: string;
	showCrosshair?: () => boolean;
	/** Keys only reach `onKey` while this holds. */
	isActive?: () => boolean;
	/**
	 * Return an action to handle the key; its default action is then prevented.
	 * Actions run in order once running view animations (e.g. a keyboard pan)
	 * end, so they see the centre under the crosshair.
	 */
	onKey: (event: KeyboardEvent) => (() => void) | undefined;
	/** Element id appended to the target's aria-describedby while bound. */
	describedBy?: string;
};

export type MapTargetKeyboard = {
	/** Recompute the crosshair, e.g. after a tool was (de)activated. */
	update: () => void;
	dispose: () => void;
};

const always = () => true;

/** Run `fn` once the view's running animations end; returns a cancel function. */
export function whenViewSettled(
	view: View,
	fn: () => void,
): (() => void) | undefined {
	if (!view.getAnimating()) {
		fn();
		return undefined;
	}
	const onChange = () => {
		if (view.getAnimating()) return;
		view.un("change", onChange);
		fn();
	};
	view.on("change", onChange);
	return () => view.un("change", onChange);
}

/**
 * Bind unmodified keys on the focused OL map target and follow target
 * replacement. Arrow and zoom keys stay with OL. The crosshair follows the view
 * centre pixel (`--ms3-view-center-x/y`), which view padding can move.
 */
export function bindMapTargetKeyboard(
	map: OlMap,
	{
		crosshairClass,
		showCrosshair = always,
		isActive = always,
		onKey,
		describedBy,
	}: MapTargetKeyboardOptions,
): MapTargetKeyboard {
	if (typeof document === "undefined") return {update() {}, dispose() {}};
	let target: HTMLElement | undefined;
	const queue: Array<() => void> = [];
	let cancelWait: (() => void) | undefined;
	const flush = () => {
		cancelWait = undefined;
		for (const action of queue.splice(0)) action();
	};
	const focused = () => target?.ownerDocument.activeElement === target;
	const update = () => {
		if (!target) return;
		target.classList.toggle(crosshairClass, focused() && showCrosshair());
		const center = map.getView().getCenter();
		const pixel = center && map.getPixelFromCoordinate(center);
		if (!pixel) return;
		for (const [name, value] of [
			["--ms3-view-center-x", pixel[0]],
			["--ms3-view-center-y", pixel[1]],
		] as const) {
			if (target.style.getPropertyValue(name) !== `${value}px`)
				target.style.setProperty(name, `${value}px`);
		}
	};
	const onKeyDown = (event: KeyboardEvent) => {
		if (
			event.target !== target ||
			!focused() ||
			event.defaultPrevented ||
			event.repeat ||
			event.isComposing ||
			event.altKey ||
			event.ctrlKey ||
			event.metaKey ||
			event.shiftKey ||
			!isActive()
		)
			return;
		const action = onKey(event);
		if (!action) return;
		event.preventDefault();
		queue.push(action);
		cancelWait ??= whenViewSettled(map.getView(), flush);
	};
	const detach = () => {
		if (!target) return;
		target.removeEventListener("keydown", onKeyDown);
		target.removeEventListener("focus", update);
		target.removeEventListener("blur", update);
		target.classList.remove(crosshairClass);
		if (describedBy) {
			const ids = (target.getAttribute("aria-describedby") ?? "")
				.split(/\s+/)
				.filter((id) => id && id !== describedBy);
			if (ids.length)
				target.setAttribute("aria-describedby", ids.join(" "));
			else target.removeAttribute("aria-describedby");
		}
		target = undefined;
	};
	const attach = () => {
		detach();
		target = map.getTargetElement() ?? undefined;
		if (!target) return;
		target.addEventListener("keydown", onKeyDown);
		target.addEventListener("focus", update);
		target.addEventListener("blur", update);
		if (describedBy)
			target.setAttribute(
				"aria-describedby",
				[target.getAttribute("aria-describedby"), describedBy]
					.filter(Boolean)
					.join(" "),
			);
		update();
	};
	map.on("change:target", attach);
	map.on("postrender", update);
	attach();
	return {
		update,
		dispose() {
			cancelWait?.();
			cancelWait = undefined;
			queue.length = 0;
			detach();
			map.un("change:target", attach);
			map.un("postrender", update);
		},
	};
}
