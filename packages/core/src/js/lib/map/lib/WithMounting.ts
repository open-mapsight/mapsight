import Control from "ol/control/Control";

import WithMap from "./WithMap";

export default class WithMounting extends WithMap {
	private _childrenContainer: HTMLDivElement | undefined;

	override init() {
		const map = this.getMap();
		if (!map) {
			console.error("Could not initialize WithMounting: map is not set");
			return;
		}

		this._childrenContainer = document.createElement("div");

		map.addControl(
			new Control({
				element: this._childrenContainer,
				target: map.getOverlayContainer(),
			}),
		);
	}

	mount(target: HTMLElement) {
		const oldViewportElements =
			target.getElementsByClassName("ol-viewport");

		// cleanup target before rendering (remove pre-rendered nodes)
		Array.from(oldViewportElements).forEach((oldViewportElement) => {
			target.removeChild(oldViewportElement);

			const oldOverlayElements =
				oldViewportElement.getElementsByClassName("ms3-map-overlay");
			if (oldOverlayElements[0]) {
				// move pre-rendered overlay to new container to reduce react re-renders
				this._childrenContainer?.appendChild(oldOverlayElements[0]);
			}
		});

		if (typeof window !== "undefined") {
			this.getMap()?.setTarget(target);
		}
	}

	unmount() {
		this.getMap()?.setTarget(undefined);
	}

	getChildrenContainer() {
		return this._childrenContainer;
	}
}
