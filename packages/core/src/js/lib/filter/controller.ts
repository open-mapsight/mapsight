import {BaseController} from "@/lib/base/controller";
import {addFilterFunction} from "@/lib/filter/selectors";
import type {FilterFunction} from "@/lib/filter/types";

export class FilterController extends BaseController {
	constructor(controllerName: string, filterFunction: FilterFunction) {
		super(controllerName);
		this.setFilterFunction(filterFunction);
	}

	setFilterFunction(filterFunction: FilterFunction) {
		addFilterFunction(this.getName(), filterFunction);
	}
}
