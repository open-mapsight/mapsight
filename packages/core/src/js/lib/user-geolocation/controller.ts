import {BaseController} from "@/lib/base/controller";
import {baseReducer} from "@/lib/base/reducer";
import type {Action} from "@/types";

import {
	REQUEST_GEOLOCATION,
	REQUEST_GEOLOCATION_FAILURE,
	REQUEST_GEOLOCATION_SUCCESS,
} from "./actions";

export class UserGeolocationController extends BaseController {
	override reduce(state = {}, action: Action) {
		switch (action.type) {
			case REQUEST_GEOLOCATION:
				return {
					...state,
					isRequesting: true,
					isEnabled: true,
				};

			case REQUEST_GEOLOCATION_SUCCESS:
				return {
					...state,
					error: null,
					isRequesting: false,
					latitude: action.latitude,
					longitude: action.longitude,
					accuracy: action.accuracy,
					lastUpdated: Date.now(),
				};

			case REQUEST_GEOLOCATION_FAILURE:
				return {
					...state,
					error: action.error || true,
					isRequesting: false,
				};

			default:
				return baseReducer(state, action);
		}
	}
}
