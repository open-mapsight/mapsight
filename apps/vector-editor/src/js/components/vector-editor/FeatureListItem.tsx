import type {MouseEventHandler} from "react";
import type React from "react";
import {useMemo} from "react";
import {useDispatch, useSelector} from "react-redux";

import GeoJSON from "ol/format/GeoJSON";
import type LineString from "ol/geom/LineString";
import type Polygon from "ol/geom/Polygon";
import {getArea, getLength} from "ol/sphere";

import {createSelector} from "@reduxjs/toolkit";
import {type Feature} from "geojson";

import {
	deselect,
	select,
	selectExclusively,
} from "@mapsight/core/lib/feature-selections/actions";
import {
	createFeatureSelectionSelector,
	getFilteredFeatures,
} from "@mapsight/core/lib/feature-selections/selectors";
import {fitMapViewToLayerFeature} from "@mapsight/core/lib/map/actions";
import type EditorMixin from "@mapsight/core/mixins/EditorMixin";

import Button from "./Button.tsx";
import Coords from "./Coords.tsx";

const geoJsonFormat = new GeoJSON();

function formatLength(line: LineString) {
	const length = getLength(line);

	// TODO: i18n / l10n
	return length >= 1000
		? `${Math.round((length / 1000) * 100) / 100} km`
		: `${Math.round(length * 100) / 100} m`;
}

function formatArea(polygon: Polygon) {
	const area = getArea(polygon);

	// TODO: i18n / l10n
	return area > 10000
		? `${Math.round((area / 1000000) * 100) / 100} km²`
		: `${Math.round(area * 100) / 100} m²`;
}

function getFeatureDescription({feature}: {feature: Feature}) {
	const geo = feature.geometry;
	switch (geo?.type) {
		case "Point":
			return (
				<>
					Punkt
					<Coords coords={geo.coordinates} />
				</>
			);

		case "LineString":
			return (
				<>
					{geo.coordinates.length <= 2 ? "Linie" : "Polylinie"}
					{" " +
						formatLength(
							geoJsonFormat.readGeometry(geo, {
								featureProjection: "EPSG:3857",
								dataProjection: "EPSG:4326",
							}) as LineString,
						)}
					<span className="ms3-vector-editor-coords-group">
						<Coords coords={geo.coordinates[0]!} /> -
						<Coords
							coords={
								geo.coordinates[geo.coordinates.length - 1]!
							}
						/>
					</span>
				</>
			);

		case "Polygon":
			return (
				<>
					Polygon
					{" " +
						formatArea(
							geoJsonFormat.readGeometry(geo, {
								featureProjection: "EPSG:3857",
								dataProjection: "EPSG:4326",
							}) as Polygon,
						)}
					<span className="ms3-vector-editor-coords-group">
						<Coords coords={geo.coordinates[0]![0]!} />,
						<Coords coords={geo.coordinates[0]![1]!} />…
					</span>
				</>
			);

		default:
			return <>Anderes Feature</>;
	}
}

function FeatureListItem({
	editor,
	as: T = "div",
	index,
	feature,
	className = "",
	...attributes
}: {
	editor: EditorMixin;
	as?: React.ElementType;
	index: number;
	feature: Feature;
	className?: string;
}) {
	const featureId = String(feature.id);
	const isSelectedSelector = useMemo(() => {
		const selectionSelector = createFeatureSelectionSelector(
			editor.controllers.featureSelections!,
			"select",
		);
		return createSelector([selectionSelector], (selectSelection) =>
			(getFilteredFeatures(selectSelection) || []).includes(featureId),
		);
	}, [editor.controllers.featureSelections, featureId]);

	const dispatch = useDispatch();
	const isSelected = useSelector(isSelectedSelector);

	const selectFeature: MouseEventHandler = (evt) => {
		const action = evt.shiftKey
			? isSelected
				? deselect
				: select
			: selectExclusively;
		dispatch(
			action(
				editor.controllers.featureSelections!,
				"select",
				String(feature.id),
			),
		);
	};

	const selectAndFitViewToFeature: MouseEventHandler = function (evt) {
		selectFeature(evt);
		dispatch(
			fitMapViewToLayerFeature(
				editor.controllers.map!,
				editor.ids.layer!,
				String(feature.id),
				{},
			),
		);
	};

	return (
		<T
			className={
				className +
				" ms3-vector-editor-feature-list__item" +
				(isSelected
					? " ms3-vector-editor-feature-list__item--selected"
					: "")
			}
			{...attributes}
		>
			<span className="ms3-vector-editor-feature-list__item__no">{`#${index} `}</span>
			<Button
				className="ms3-vector-editor-feature-list__item__main"
				onClick={selectFeature}
				onDoubleClick={selectAndFitViewToFeature}
				label="Element auswählen"
			>
				{getFeatureDescription({feature: feature})}
			</Button>
			<Button
				icon="icon-crosshair"
				label="Element zentrieren"
				className="ms3-vector-editor-button--inline ms3-vector-editor-feature-list__item__add"
				onClick={selectAndFitViewToFeature}
			/>
		</T>
	);
}

export default FeatureListItem;
