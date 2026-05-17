import {hasGeolocationSupport} from "@mapsight/core/lib/helpers";
import {animate} from "@mapsight/core/lib/map/actions";
import {getGeolocation} from "@mapsight/core/lib/user-geolocation/actions";
import {createUserGeolocationSelector} from "@mapsight/core/lib/user-geolocation/selectors";

import proj4 from "proj4";
import  {memo, useCallback, useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import * as c from "../../config/constants/controllers";

import {translate} from "../../helpers/i18n";
import modClasses from "../../helpers/mod-classes";

const geoLocSelector = createUserGeolocationSelector(c.USER_GEOLOCATION);

const UserGeoLocationButton = memo(
	/**
	 * @param {{
	 *   additionalClasses?: string
	 * }} props props
	 * @returns {import('react').ReactElement} element
	 */
	function UserGeoLocationButton({additionalClasses = ""}) {
		const dispatch = useDispatch();
		const {longitude, latitude, error, isEnabled, isRequesting} =
			useSelector(geoLocSelector);
		const [moveToGeoLoc, setMoveToGeoLoc] = useState(false);
		const [showButton, setShowButton] = useState(true);

		useEffect(() => {
			setShowButton(hasGeolocationSupport);
		}, []);

		useEffect(() => {
			if (moveToGeoLoc && longitude && latitude) {
				// move only once per click
				setMoveToGeoLoc(false);
				dispatch(
					animate(c.MAP, {
						center: proj4("WGS84", "EPSG:3857", [
							longitude,
							latitude,
						]),
						duration: 500,
					}),
				);
			}
		}, [dispatch, longitude, latitude, moveToGeoLoc]);

		const onClick = useCallback(
			/** @param {React.MouseEvent} e event */
			function onClick(e) {
				e.stopPropagation();
				setMoveToGeoLoc(true);
				dispatch(getGeolocation());
			},
			[dispatch],
		);

		if (!showButton) {
			return null;
		}

		return (
			<button
				type="button"
				className={
					modClasses("ms3-map-overlay__button", {
						"with-icon": true,
						"geo-location": true,
						"geo-location--active": isEnabled,
						"geo-location--inactive": !isEnabled,
						"geo-location--requesting": isRequesting,
						"geo-location--error": !!error,
					}) +
					" " +
					additionalClasses
				}
				onClick={onClick}
				aria-label={translate("ui.user-geo-location-button.ariaLabel")}
			>
				<span className="ms3-map-overlay__button__label">
					{translate("ui.user-geo-location-button.label")}
				</span>
			</button>
		);
	},
);
export default UserGeoLocationButton;
