import type {PropsWithChildren} from "react";
import {createContext, useContext} from "react";

import type {
	FullUiState,
	MapsightUiFeatureId,
	SelectFeatureActionOptions,
} from "../../types";
import type {FeatureListStateProps} from "./hooks/useFeatureListState";

export type FeatureListContextValue = {
	state: Omit<FeatureListStateProps, "listUiOptions">;
	listUiOptions: Partial<FullUiState["list"]>;
	enableKeyboardControl: boolean;
	showFeatureListInfo: boolean;
	selectFeature: (
		featureId: MapsightUiFeatureId,
		options: SelectFeatureActionOptions,
	) => void;
	deselectFeature: (
		featureId: MapsightUiFeatureId,
		options: SelectFeatureActionOptions,
	) => void;
};

const FeatureListContext = createContext<FeatureListContextValue | null>(null);
FeatureListContext.displayName = "FeatureListContext";

export const FeatureListContextProvider = ({
	value,
	children,
}: PropsWithChildren<{
	value: FeatureListContextValue;
}>) => (
	<FeatureListContext.Provider value={value}>
		{children}
	</FeatureListContext.Provider>
);

export const useFeatureListContext = () => {
	const value = useContext(FeatureListContext);
	if (value === null) {
		throw new Error("FeatureListContext is not provided");
	}

	return value;
};
