import type {ReactNode} from "react";
import {useSelector} from "react-redux";

import {
	FEATURE_SOURCE_DATA_ADD_FEATURE,
	FEATURE_SOURCE_DATA_ADD_FEATURES,
	FEATURE_SOURCE_DATA_REMOVE_FEATURE,
	FEATURE_SOURCE_DATA_REMOVE_FEATURES,
	FEATURE_SOURCE_DATA_UPDATE_FEATURE,
	FEATURE_SOURCE_DATA_UPDATE_FEATURES,
} from "@mapsight/core/lib/feature-sources/actions";

import TimeDistanceFromNow from "./TimeDistanceFromNow.tsx";

// TODO: i18n
const ACTION_TYPE_LABEL_MAP: Record<string, string> = {
	__default: "Andere Änderung",
	[FEATURE_SOURCE_DATA_ADD_FEATURE]: "Feature hinzugefügt",
	[FEATURE_SOURCE_DATA_ADD_FEATURES]: "Features hinzugefügt",
	[FEATURE_SOURCE_DATA_UPDATE_FEATURE]: "Feature bearbeitet",
	[FEATURE_SOURCE_DATA_UPDATE_FEATURES]: "Features bearbeitet",
	[FEATURE_SOURCE_DATA_REMOVE_FEATURE]: "Feature gelöscht",
	[FEATURE_SOURCE_DATA_REMOVE_FEATURES]: "Features gelöscht",
};

function mapActionTypeToLabel(actionType: string) {
	return ACTION_TYPE_LABEL_MAP[actionType] ?? ACTION_TYPE_LABEL_MAP.__default;
}

// TODO: Move types to @mapsight/core
type Snapshot = {
	lastActionType: string;
	lastUpdate: number | null;
};
type DataHistory = {
	past: Snapshot[];
};

function History({featureSource}: {featureSource: string}) {
	const dataHistory = useSelector(
		(state: any) =>
			state.featureSources[featureSource].dataHistory as DataHistory,
	);
	const note = useSelector(
		(state: any) => state.featureSources[featureSource].note as ReactNode,
	);

	return (
		<ul className={"ms3-vector-editor-history"}>
			<li key="preset">Aktuell: {note}</li>

			{dataHistory?.past
				?.slice()
				.reverse()
				.map((snapshot: Snapshot, i: number) => (
					<li key={`past-${i}`}>
						#{i + 1} {mapActionTypeToLabel(snapshot.lastActionType)}{" "}
						{snapshot.lastUpdate && (
							<TimeDistanceFromNow
								date={new Date(snapshot.lastUpdate)}
							/>
						)}
					</li>
				))}
		</ul>
	);
}

export default History;
