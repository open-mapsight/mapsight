import {
	type CSSProperties,
	type ReactElement,
	type RefObject,
	memo,
	useEffect,
	useRef,
	useState,
} from "react";
import {useSelector} from "react-redux";

import {createSelector} from "reselect";

import {
	type FeatureSelectionState,
	createFeatureSelectionSelector,
	getFilteredFeatures,
} from "@mapsight/core/lib/feature-selections/selectors";
import {findFeatureInFeatureSourcesById} from "@mapsight/core/lib/feature-sources/selectors";
import type {FeatureSourcesState} from "@mapsight/core/lib/feature-sources/types";
import {mapSizeSelector as getMapSize} from "@mapsight/core/lib/map/selectors";
import type {MapState} from "@mapsight/core/lib/map/types";
import type {Feature, State} from "@mapsight/core/types";

import {
	FEATURE_SELECTIONS,
	FEATURE_SOURCES,
	MAP,
} from "../../config/constants/controllers";
import {FEATURE_SELECTION_HIGHLIGHT} from "../../config/feature/selections";
import getFeatureProperty from "../../helpers/get-feature-property";
import type {MapsightUiFeature} from "../../types";
import TooltipContent from "./tooltip-content";

const featureSelector = createSelector(
	(state) => state[FEATURE_SOURCES] as FeatureSourcesState,
	createFeatureSelectionSelector(
		FEATURE_SELECTIONS,
		FEATURE_SELECTION_HIGHLIGHT,
	),
	(
		featureSources: FeatureSourcesState,
		selection: FeatureSelectionState | undefined,
	) => {
		const features = getFilteredFeatures(selection);
		const featureId = features && features[0];
		if (featureId) {
			return findFeatureInFeatureSourcesById(featureSources, featureId);
		}

		return null;
	},
);

function mapSizeSelector(state: State) {
	return getMapSize(state[MAP] as MapState);
}

export type Position = null | {
	left: number;
	right: number;
	top: number;
	bottom: number;
};

/**
 * @param feature feature
 * @param tooltipElementRef feature
 * @returns position and withTransition
 */
function useGetPositionWithTransition(
	feature: Feature | null,
	tooltipElementRef: RefObject<HTMLElement | null>,
): [Position, boolean] {
	const [withTransition, setWithTransition] = useState(true);

	const mapSize = useSelector(mapSizeSelector);

	const [position, setPosition] = useState<null | Position>(null);

	useEffect(() => {
		setWithTransition(false);
	}, [mapSize]);

	useEffect(() => {
		const mapElNull = tooltipElementRef.current
			?.closest(".ms3-map-wrapper")
			?.querySelector(".ms3-map-target");

		if (!mapElNull || !feature) {
			return undefined;
		}

		const mapEl = mapElNull;

		function onMouseMove(e: MouseEvent) {
			const x = e.clientX;
			const y = e.clientY;
			const {left, right, top, bottom} = mapEl.getBoundingClientRect();
			setPosition({
				left: x - left,
				right: right - x,
				top: y - top,
				bottom: bottom - y,
			});
			setWithTransition(true);
		}

		function onMouseOut() {
			setPosition(null);
			setWithTransition(true);
		}

		mapEl.addEventListener("mousemove", onMouseMove);
		mapEl.addEventListener("mouseout", onMouseOut);

		return () => {
			setPosition(null);
			setWithTransition(true);

			mapEl.removeEventListener("mousemove", onMouseMove);
			mapEl.removeEventListener("mouseout", onMouseOut);
		};
	}, [feature, setPosition, tooltipElementRef]);

	return [position, withTransition];
}

function Tooltip() {
	const tooltipElementRef = useRef<HTMLDivElement>(null);
	const feature = useSelector(featureSelector) as MapsightUiFeature | null;

	// Keeping the last feature to allow fade out without losing the content
	const [lastFeature, setLastFeature] = useState<MapsightUiFeature | null>(
		null,
	);

	useEffect(() => {
		if (!feature) {
			setLastFeature(feature);
		}
	}, [feature, setLastFeature]);

	const [position, withTransition] = useGetPositionWithTransition(
		feature,
		tooltipElementRef,
	);

	const localFeature = feature || lastFeature;
	if (!localFeature) {
		return;
	}

	const classes = `ms3-tooltip ms3-tooltip--${
		feature ? "active" : "inactive"
	}`;
	const classesInner = `ms3-tooltip__inner ms3-tooltip__inner--${
		feature ? "active" : "inactive"
	}`;

	const styles: CSSProperties = {};

	if (position) {
		styles.transform = `translate(${-position.right}px, ${position.top}px)`;
	} else {
		styles.display = "none";
	}

	if (!withTransition) {
		styles.transition = "none";
	}

	const html = getFeatureProperty(localFeature, "tooltip", "") as string;
	const text = html
		? ""
		: (getFeatureProperty(localFeature, "name", "") as string);

	let content: null | ReactElement = null;
	if (html) {
		content = (
			<div
				className={classesInner}
				dangerouslySetInnerHTML={{__html: html}}
			/>
		);
	} else if (text) {
		content = <div className={classesInner}>{text}</div>;
	}

	return (
		<div className={classes} style={styles} ref={tooltipElementRef}>
			<TooltipContent feature={localFeature} html={html} text={text}>
				{content}
			</TooltipContent>
		</div>
	);
}

export default memo(Tooltip);
