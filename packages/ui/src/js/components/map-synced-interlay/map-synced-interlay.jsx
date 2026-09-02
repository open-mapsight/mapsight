import {memo} from "react";
import {useSelector} from "react-redux";

import {isViewMobileOrMapOnlySelector} from "../../store/selectors";
import ErrorBoundary from "../error-boundary";
import Tooltip from "./tooltip";

function MapSyncedInterlay({size}) {
	const isViewMobileOrMapOnly = useSelector(isViewMobileOrMapOnlySelector);
	const [width = "100%", height = "100%"] = size || [];

	return (
		<div
			className="ms3-map-synced-interlay"
			style={{width: width, height: height}}
		>
			{!isViewMobileOrMapOnly && (
				<ErrorBoundary variant="overlay">
					<Tooltip />
				</ErrorBoundary>
			)}
		</div>
	);
}

export default memo(MapSyncedInterlay);
