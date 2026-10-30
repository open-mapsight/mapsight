import {memo} from "react";

import {parseMapsightIcon, uiIconSrc} from "@mapsight/traffic-style/icon";
import {hasIcon, isComposableIcon} from "@mapsight/traffic-style/icon-meta";
import {hasPictogram} from "@mapsight/traffic-style/pictograms";

import {siteConfig} from "../../config";

export type MapsightIconProps = {
	id: string | undefined;
	className?: string;
	/** With one dimension omitted, composed icons preserve their aspect ratio. */
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
	width,
	height,
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

	const displayHeight =
		height ??
		(width === undefined ? 40 : (width * icon.height) / icon.width);
	const displayWidth = width ?? (displayHeight * icon.width) / icon.height;
	return (
		<img
			className={className}
			src={icon.src}
			width={displayWidth}
			height={displayHeight}
			style={{objectFit: "contain"}}
			alt=""
		/>
	);
}

function MapsightIcon({id, className, width, height}: MapsightIconProps) {
	if (!id) {
		return null;
	}

	if (
		id.includes("/") ||
		isComposableIcon(id) ||
		(!hasIcon(id) && hasPictogram(id)) ||
		parseMapsightIcon(id)?.label != null
	) {
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
