import {memo} from "react";

import type {LayerAttributions} from "@mapsight/core/lib/map/selectors";

function AttributionEntries({
	children,
	attributions,
}: {
	children?: React.ReactNode;
	attributions?: LayerAttributions;
}) {
	return (
		<div className="ms3-attribution">
			<ul className="ms3-attribution__entries">
				{attributions &&
					Object.entries(attributions).map(([key, attr]) => (
						<li
							className="ms3-attribution__entry"
							key={key}
							dangerouslySetInnerHTML={{__html: attr}}
						/>
					))}
				{children && (
					<li className="ms3-attribution__entry ms3-attribution__entry--additional">
						{children}
					</li>
				)}
			</ul>
		</div>
	);
}

export default memo(AttributionEntries);
