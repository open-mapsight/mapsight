import type {Selector} from "@reduxjs/toolkit";
import {createSelector} from "@reduxjs/toolkit";

import type {FeatureSourceState} from "@/lib/feature-sources/types";
import type {State} from "@/types";

import type {UserGeolocationError} from "./actions";
import {ERROR_NOT_ACCURATE} from "./actions";

export const STATUS_LOADING = "loading";
export const STATUS_ERROR = "error";

export const geolocationStatusSelector: Selector<
	UserGeolocationState,
	string | null
> = createSelector(
	[
		(state: UserGeolocationState) => state.error,
		(state: UserGeolocationState) => state.isRequesting,
	],
	(error, isRequesting) =>
		isRequesting ? STATUS_LOADING : error ? STATUS_ERROR : null,
);

export type UserGeolocationState = {
	error?: UserGeolocationError;
	isRequesting?: boolean;
	isEnabled?: boolean;
	latitude?: number;
	longitude?: number;
	accuracy?: number;
	lastUpdated?: number;
};

const createUserGeolocationIsEnabledSelector =
	(userGeolocationControllerName: string) => (state: State) =>
		(state[userGeolocationControllerName] as UserGeolocationState)
			?.isEnabled ?? false;

export default createUserGeolocationIsEnabledSelector;

export const createUserGeolocationSelector = (
	userGeolocationControllerName: string,
	{minimumAccuracy}: {minimumAccuracy?: number} = {},
): Selector<State, UserGeolocationState> =>
	createSelector(
		[
			(state: State) =>
				state[userGeolocationControllerName] as UserGeolocationState,
		],
		(geoLoc) => {
			if (minimumAccuracy !== undefined && !geoLoc.error) {
				if (geoLoc.accuracy && geoLoc.accuracy >= minimumAccuracy) {
					return {
						...geoLoc,
						error: ERROR_NOT_ACCURATE,
					};
				}
			}

			return geoLoc;
		},
	);

export const createUserGeolocationAsFeatureSelector = (
	userGeolocationControllerName: string,
	{minimumAccuracy}: {minimumAccuracy?: number} = {},
): Selector<State, FeatureSourceState> =>
	createSelector(
		createUserGeolocationSelector(userGeolocationControllerName, {
			minimumAccuracy,
		}),
		(userGeolocation): FeatureSourceState => {
			const sourceData = {
				type: "local",
				lastUpdate: Date.now(),
				lastActionType: null,
				data: null,
			} satisfies FeatureSourceState;

			if (userGeolocation.error) {
				return {
					...sourceData,
					error: userGeolocation.error,
				};
			}

			if (!userGeolocation.longitude || !userGeolocation.latitude) {
				return sourceData;
			}

			const id = userGeolocationControllerName + "Feature";

			return {
				...sourceData,
				data: {
					type: "FeatureCollection",
					features: [
						{
							type: "Feature",
							geometry: {
								type: "Point",
								coordinates: [
									userGeolocation.longitude,
									userGeolocation.latitude,
								],
							},
							id: id,
							properties: {
								id: id,
								...userGeolocation,
							},
						},
					],
				},
			};
		},
	);
