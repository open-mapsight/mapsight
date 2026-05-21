import type {Dispatch} from "@reduxjs/toolkit";

import type {ActionOrThunk, ThunkAction} from "@/types";

import {hasGeolocationSupport} from "../helpers";

export const ERROR_NO_GEOLOCATION_SUPPORT = "ERROR_NO_GEOLOCATION_SUPPORT";
export const ERROR_PERMISSION_DENIED = "ERROR_PERMISSION_DENIED"; // ~ PositionError.PERMISSION_DENIED
export const ERROR_UNAVAILABLE = "ERROR_UNAVAILABLE"; // ~ PositionError.POSITION_UNAVAILABLE
export const ERROR_TIMEOUT = "ERROR_TIMEOUT"; // ~ PositionError.TIMEOUT
export const ERROR_NOT_ACCURATE = "ERROR_NOT_ACCURATE";
export const ERROR_UNKNOWN = "ERROR_UNKNOWN";

export type UserGeolocationError =
	| typeof ERROR_NO_GEOLOCATION_SUPPORT
	| typeof ERROR_PERMISSION_DENIED
	| typeof ERROR_UNAVAILABLE
	| typeof ERROR_TIMEOUT
	| typeof ERROR_NOT_ACCURATE
	| typeof ERROR_UNKNOWN;

export const REQUEST_GEOLOCATION_SUCCESS = "REQUEST_GEOLOCATION_SUCCESS";

export function getGeolocationSuccess(
	latitude: number,
	longitude: number,
	accuracy: number,
) {
	return {
		type: REQUEST_GEOLOCATION_SUCCESS,
		latitude: latitude,
		longitude: longitude,
		accuracy: accuracy,
	};
}

export const REQUEST_GEOLOCATION_FAILURE = "REQUEST_GEOLOCATION_FAILURE";

export function getGeolocationFailure(error: string) {
	return {
		type: REQUEST_GEOLOCATION_FAILURE,
		error: error,
	};
}

export const REQUEST_GEOLOCATION = "REQUEST_GEOLOCATION";

/**
 * @param positionError position error from Geolocation API
 * @returns mapsight user geolocation error state
 */
function mapGeolocationPositionErrorToError(
	positionError: GeolocationPositionError,
) {
	switch (positionError.code) {
		case positionError.PERMISSION_DENIED:
			return ERROR_PERMISSION_DENIED;
		case positionError.POSITION_UNAVAILABLE:
			return ERROR_UNAVAILABLE;
		case positionError.TIMEOUT:
			return ERROR_TIMEOUT;
		default:
			return ERROR_UNKNOWN;
	}
}

export function getGeolocation(options?: PositionOptions): ActionOrThunk {
	if (!hasGeolocationSupport) {
		return {
			type: REQUEST_GEOLOCATION_FAILURE,
			error: ERROR_NO_GEOLOCATION_SUPPORT,
		};
	}

	const thunk: ThunkAction = (dispatch: Dispatch) => {
		dispatch({type: REQUEST_GEOLOCATION});

		function handleGeoPosition(position: GeolocationPosition) {
			dispatch(
				getGeolocationSuccess(
					position.coords.latitude,
					position.coords.longitude,
					position.coords.accuracy,
				),
			);
		}

		function handleGeoError(positionError: GeolocationPositionError) {
			dispatch(
				getGeolocationFailure(
					mapGeolocationPositionErrorToError(positionError),
				),
			);
		}

		// eslint-disable-next-line n/no-unsupported-features/node-builtins
		window.navigator.geolocation.getCurrentPosition(
			handleGeoPosition,
			handleGeoError,
			options,
		);
	};

	return thunk;
}
