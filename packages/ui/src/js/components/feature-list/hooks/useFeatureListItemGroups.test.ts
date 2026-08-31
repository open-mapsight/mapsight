import {createElement} from "react";

import {renderHook} from "@testing-library/react";
import {describe, expect, it} from "vitest";

import type {MapsightUiFeature} from "../../../types";
import FeatureListItem from "../../feature-list-item";
import useFeatureListItemGroups from "./useFeatureListItemGroups";

function HostItemWrapper({
	children,
	className,
}: {
	children?: React.ReactNode;
	className?: string;
	feature?: MapsightUiFeature;
}) {
	return createElement("li", {className}, children);
}

function feature(id: string, name: string, group?: string): MapsightUiFeature {
	return {
		type: "Feature",
		id,
		geometry: {type: "Point", coordinates: [0, 0]},
		properties: {id, name, listName: name, ...(group ? {group} : {})},
	} as MapsightUiFeature;
}

function groupedNames(result: {groups: {name: string}[] | null}) {
	return result.groups?.map((group) => group.name);
}

describe("useFeatureListItemGroups", () => {
	it("passes itemAs as FeatureListItem `as` (wrapper), not a full replacement", () => {
		const features = [feature("1", "One"), feature("2", "Two")];
		const deselectFeature = () => {};
		const {result} = renderHook(() =>
			useFeatureListItemGroups(
				// falsy disables grouping (same as production callers)
				undefined as unknown as never,
				features,
				HostItemWrapper,
				{showFeatureListInfo: false, deselectFeature},
			),
		);

		expect(result.current.groups).toBeNull();
		expect(result.current.items).toHaveLength(1);
		expect(result.current.items[0]).toHaveLength(2);

		const first = result.current.items[0]![0]!;
		expect(first.type).toBe(FeatureListItem);
		expect(first.props.as).toBe(HostItemWrapper);
		expect(first.props.feature).toBe(features[0]);
		expect(first.props.showFeatureListInfo).toBe(false);
		expect(first.props.deselectFeatures).toBe(deselectFeature);
		expect(first.props).not.toHaveProperty("deselectFeature");
	});

	it("orders numbered group headers even when a later section appears first", () => {
		const features = [
			feature("bus", "Busparkplatz", "3) Weitere"),
			feature("pr", "P+R", "2) Park & Ride"),
			feature("ph", "Parkhaus", "1) Parkhäuser"),
		];
		const {result} = renderHook(() =>
			useFeatureListItemGroups("h3", features, HostItemWrapper, {
				showFeatureListInfo: false,
				deselectFeature: () => {},
			}),
		);

		expect(groupedNames(result.current)).toEqual([
			"1) Parkhäuser",
			"2) Park & Ride",
			"3) Weitere",
		]);
	});

	it("keeps first-seen order when group names are not numbered", () => {
		const features = [
			feature("b", "B", "Innovationsorte"),
			feature("c", "C", "Glasfaserausbau"),
			feature("a", "A", "Infrastruktur"),
		];
		const {result} = renderHook(() =>
			useFeatureListItemGroups("h3", features, HostItemWrapper, {
				showFeatureListInfo: false,
				deselectFeature: () => {},
			}),
		);

		expect(groupedNames(result.current)).toEqual([
			"Innovationsorte",
			"Glasfaserausbau",
			"Infrastruktur",
		]);
	});

	it("sorts numbered prefixes numerically and keeps encounter order inside a group", () => {
		const features = [
			feature("ten", "Later", "10) Extra"),
			feature("near", "Closer B", "2) Park & Ride"),
			feature("far", "Closer A", "2) Park & Ride"),
		];
		const {result} = renderHook(() =>
			useFeatureListItemGroups("h3", features, HostItemWrapper, {
				showFeatureListInfo: false,
				deselectFeature: () => {},
			}),
		);

		expect(groupedNames(result.current)).toEqual([
			"2) Park & Ride",
			"10) Extra",
		]);
		expect(
			result.current.groups?.[0]?.features.map((item) => item.id),
		).toEqual(["near", "far"]);
	});

	it("places numbered groups before unnumbered names", () => {
		const features = [
			feature("b", "B", "Innovationsorte"),
			feature("pr", "P+R", "2) Park & Ride"),
			feature("a", "A", "Infrastruktur"),
		];
		const {result} = renderHook(() =>
			useFeatureListItemGroups("h3", features, HostItemWrapper, {
				showFeatureListInfo: false,
				deselectFeature: () => {},
			}),
		);

		expect(groupedNames(result.current)).toEqual([
			"2) Park & Ride",
			"Innovationsorte",
			"Infrastruktur",
		]);
	});
});
