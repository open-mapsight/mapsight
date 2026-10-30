import WithMap from "./WithMap";

export const DEFAULT_CURSOR = "default";

export default class WithCursor extends WithMap {
	override init() {
		this.getAndObserveUncontrolled(
			(state) => state.cursor as string | undefined,
			(newCursor = DEFAULT_CURSOR) => {
				const viewport = this.getMap()?.getViewport();
				if (viewport) {
					viewport.style.cursor = newCursor;
				}
			},
		);
	}
}
