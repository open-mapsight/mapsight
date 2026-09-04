import {memo} from "react";

import {parseMapsightIcon, uiIconSrc} from "@mapsight/traffic-style/icon";
import {isComposableIcon} from "@mapsight/traffic-style/icon-meta";

import {siteConfig} from "../../config";

export type MapsightIconProps = {
	id: string | undefined;
	className?: string;
	width?: number;
	height?: number;
};

function SpriteMapsightIcon({
	id,
	className,
	width = 40,
	height = 40,
}: {
	id: string;
	className?: string;
	width?: number;
	height?: number;
}) {
	const iconFileName = `${id}-plain.png`;
	const iconSrc1x = `${siteConfig.imagesUrl}mapsight-icons/${iconFileName}`;
	const iconSrcSet =
		`${siteConfig.imagesUrl}mapsight-icons/${iconFileName} 1x, ` +
		`${siteConfig.imagesUrl}mapsight-icons-2x/${iconFileName} 2x`;

	return (
		<img
			className={className}
			src={iconSrc1x}
			srcSet={iconSrcSet}
			width={width}
			height={height}
			alt=""
		/>
	);
}

function ComposableMapsightIcon({
	id,
	className,
	width = 40,
	height = 40,
}: {
	id: string;
	className?: string;
	width?: number;
	height?: number;
}) {
	const icon = uiIconSrc(id, "plain");
	if (!icon) {
		return (
			<SpriteMapsightIcon
				id={id}
				className={className}
				width={width}
				height={height}
			/>
		);
	}

	return (
		<img
			className={className}
			src={icon.src}
			width={width}
			height={height}
			alt=""
		/>
	);
}

function MapsightIcon({
	id,
	className,
	width = 40,
	height = 40,
}: MapsightIconProps) {
	if (!id) {
		return null;
	}

	if (isComposableIcon(id) || parseMapsightIcon(id)?.label != null) {
		return (
			<ComposableMapsightIcon
				id={id}
				className={className}
				width={width}
				height={height}
			/>
		);
	}

	return (
		<SpriteMapsightIcon
			id={id}
			className={className}
			width={width}
			height={height}
		/>
	);
}

export default memo(MapsightIcon);
