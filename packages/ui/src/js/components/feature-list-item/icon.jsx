import {memo} from "react";

import {siteConfig} from "../../config";

function MapsightIcon({id}) {
	if (!id) {
		return null;
	}

	// TODO make these paths configurable
	const iconFileName = `${id}-plain.png`;
	const iconSrc1x = `${siteConfig.imagesUrl}mapsight-icons/${iconFileName}`;
	const iconSrcSet =
		`${siteConfig.imagesUrl}mapsight-icons/${iconFileName} 1x, ` +
		`${siteConfig.imagesUrl}mapsight-icons-2x/${iconFileName} 2x`;

	return <img src={iconSrc1x} srcSet={iconSrcSet} alt="" />;
}

function FeatureListIcon({selectable, mapsightIconId, as: T, ...attributes}) {
	let className = `ms3-list__icon ms3-list__icon--id-${
		mapsightIconId || "-"
	}`;
	if (selectable) {
		className += " ms3-list__icon--selectable";
	}

	return (
		<T className={className} aria-hidden={true} {...attributes}>
			<MapsightIcon id={mapsightIconId} />
		</T>
	);
}

export default memo(FeatureListIcon);
