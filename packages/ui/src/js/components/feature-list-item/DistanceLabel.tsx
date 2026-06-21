import {useMemo} from "react";
import {useSelector} from "react-redux";

import type {Coordinate} from "ol/coordinate";
import {getDistance} from "ol/sphere";

import type {UserGeolocationState} from "@mapsight/core/lib/user-geolocation/selectors";
import type {State} from "@mapsight/core/types";

import getGeoJsonFeatureSortAnchor from "@mapsight/lib-ol/feature/getGeoJsonFeatureSortAnchor";

import {USER_GEOLOCATION} from "../../config/constants/controllers";
import {getDocumentLanguage, translate} from "../../helpers/i18n";
import type {FeatureListItemDistanceLabelProps} from "./types";

function formatDistance(
	distanceMeters: number,
	language = getDocumentLanguage(),
) {
	if (distanceMeters < 1000) {
		const roundedMeters = Math.max(
			10,
			Math.round(distanceMeters / 10) * 10,
		);
		return `${roundedMeters.toLocaleString(language)} m`;
	}

	const kilometers = distanceMeters / 1000;
	if (kilometers < 10) {
		return `${kilometers.toLocaleString(language, {
			maximumFractionDigits: 1,
			minimumFractionDigits: 1,
		})} km`;
	}

	return `${Math.round(kilometers).toLocaleString(language)} km`;
}

function getDistanceFromUserGeolocation(
	feature: FeatureListItemDistanceLabelProps["feature"],
	userGeolocation: UserGeolocationState,
) {
	if (
		!userGeolocation.isEnabled ||
		userGeolocation.longitude === undefined ||
		userGeolocation.latitude === undefined
	) {
		return null;
	}

	const anchor = getGeoJsonFeatureSortAnchor(feature);
	if (!anchor) {
		return null;
	}

	const userCoordinate: Coordinate = [
		userGeolocation.longitude,
		userGeolocation.latitude,
	];

	return getDistance(userCoordinate, anchor);
}

export default function DistanceLabel({
	feature,
}: FeatureListItemDistanceLabelProps) {
	const userGeolocation = useSelector(
		(state: State) => state[USER_GEOLOCATION] as UserGeolocationState,
	);
	const distance = useMemo(
		() => getDistanceFromUserGeolocation(feature, userGeolocation),
		[feature, userGeolocation],
	);

	if (distance === null) {
		return null;
	}

	const formattedDistance = formatDistance(distance);

	return (
		<span
			className="ms3-list__distance"
			title={`${translate("ui.feature-list.distance.fromGeolocation")}: ${formattedDistance}`}
		>
			{formattedDistance}
		</span>
	);
}
