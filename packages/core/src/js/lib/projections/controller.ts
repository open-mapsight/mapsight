import proj4 from "proj4";

import {BaseController} from "../base/controller";

export class ProjectionsController extends BaseController {
	override init() {
		this.getAndSubscribeUncontrolled((value) => {
			if (value && typeof value === "string") {
				proj4.defs(value);
			}
		});
	}

	static getProj4() {
		return proj4;
	}
}
