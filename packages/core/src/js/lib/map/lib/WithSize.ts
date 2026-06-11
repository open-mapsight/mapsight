import {async, controlled, quiet, set} from "../../base/actions";
import WithMap from "./WithMap";

export default class WithSize extends WithMap {
	override init() {
		const map = this.getMap();
		if (!map) {
			console.error("Could not initialize WithSize: map is not set");
			return;
		}

		const name = this.getName();

		map.on("change:size", ({oldValue}) => {
			const newValue = map.getSize();
			if (
				newValue &&
				(!oldValue ||
					oldValue[0] !== newValue[0] ||
					oldValue[1] !== newValue[1])
			) {
				this.dispatch(
					quiet(controlled(async(set([name, "size"], newValue)))),
				);
			}
		});
	}
}
