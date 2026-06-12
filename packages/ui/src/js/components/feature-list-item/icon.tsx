import type {ElementType} from "react";
import {memo} from "react";

import MapsightIcon from "../mapsight-icon/mapsight-icon";

export type FeatureListIconProps = {
	selectable?: boolean;
	mapsightIconId?: string;
	as?: ElementType;
	className?: string;
};

function FeatureListIcon({
	selectable,
	mapsightIconId,
	as: T = "span",
	className: classNameProp,
	...attributes
}: FeatureListIconProps & Record<string, unknown>) {
	let className = `ms3-list__icon ms3-list__icon--id-${
		mapsightIconId || "-"
	}`;
	if (selectable) {
		className += " ms3-list__icon--selectable";
	}
	if (classNameProp) {
		className += ` ${classNameProp}`;
	}

	return (
		<T className={className} aria-hidden={true} {...attributes}>
			<MapsightIcon id={mapsightIconId} />
		</T>
	);
}

export default memo(FeatureListIcon);
