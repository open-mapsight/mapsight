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

function feature(id: string, name: string): MapsightUiFeature {
	return {
		type: "Feature",
		id,
		geometry: {type: "Point", coordinates: [0, 0]},
		properties: {id, name, listName: name},
	} as MapsightUiFeature;
}

describe("useFeatureListItemGroups", () => {
	it("passes itemAs as FeatureListItem `as` (wrapper), not a full replacement", () => {
		const features = [feature("1", "One"), feature("2", "Two")];
		const {result} = renderHook(() =>
			useFeatureListItemGroups(
				// falsy disables grouping (same as production callers)
				undefined as unknown as never,
				features,
				HostItemWrapper,
				{showFeatureListInfo: false},
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
	});
});
