import type React from "react";

const MapOverlayBox = <
	Type extends React.ElementType,
	TProps = React.HTMLAttributes<Type>,
>({
	as: T = "div",
	className = "",
	...props
}: {
	as?: React.ElementType;
	className?: string;
} & TProps) => <T className={`ms3-map-overlay__box ${className}`} {...props} />;

MapOverlayBox.TopLeft = ({style = {}, ...props}) =>
	MapOverlayBox({
		...props,
		style: {position: "absolute", top: 0, left: 0, ...style},
	});
MapOverlayBox.TopRight = ({style = {}, ...props}) =>
	MapOverlayBox({
		...props,
		style: {position: "absolute", top: 0, right: 0, ...style},
	});
MapOverlayBox.BottomLeft = ({style = {}, ...props}) =>
	MapOverlayBox({
		...props,
		style: {position: "absolute", bottom: 0, left: 0, ...style},
	});
MapOverlayBox.BottomRight = ({style = {}, ...props}) =>
	MapOverlayBox({
		...props,
		style: {position: "absolute", bottom: 0, right: 0, ...style},
	});

export default MapOverlayBox;
