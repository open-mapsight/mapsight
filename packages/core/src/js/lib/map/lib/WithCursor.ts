import WithMap from "./WithMap";

export const DEFAULT_CURSOR = "default";

export default class WithCursor extends WithMap {
	override init() {
		this.getAndObserveUncontrolled(
			(state) => state.cursor as string | undefined,
			(newCursor = DEFAULT_CURSOR) => {
				const map = this.getMap();
				if (map) {
					map.getViewport().style.cursor = newCursor;
				}
			},
		);
	}
}
