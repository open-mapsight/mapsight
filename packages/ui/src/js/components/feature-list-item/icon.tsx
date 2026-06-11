import type {ElementType} from "react";
import {memo} from "react";

import {isComposableIcon} from "@mapsight/traffic-style/icon-meta";

import {siteConfig} from "../../config";
import {useMapsightIcon} from "../../hooks/useMapsightIcon";

function SpriteMapsightIcon({id}: {id: string}) {
	const iconFileName = `${id}-plain.png`;
	const iconSrc1x = `${siteConfig.imagesUrl}mapsight-icons/${iconFileName}`;
	const iconSrcSet =
		`${siteConfig.imagesUrl}mapsight-icons/${iconFileName} 1x, ` +
		`${siteConfig.imagesUrl}mapsight-icons-2x/${iconFileName} 2x`;

	return <img src={iconSrc1x} srcSet={iconSrcSet} alt="" />;
}

function ComposableMapsightIcon({id}: {id: string}) {
	const {src, error} = useMapsightIcon(id, "plain");

	if (error) {
		return <SpriteMapsightIcon id={id} />;
	}

	if (!src) {
		return null;
	}

	return <img src={src} alt="" />;
}

function MapsightIcon({id}: {id: string | undefined}) {
	if (!id) {
		return null;
	}

	if (isComposableIcon(id)) {
		return <ComposableMapsightIcon id={id} />;
	}

	return <SpriteMapsightIcon id={id} />;
}

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
