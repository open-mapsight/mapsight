import type {ComponentType, ElementType, PropsWithChildren} from "react";
import {createContext, useContext} from "react";

import type {FullUiState} from "../../types";
import type {
	FeatureListItemDistanceLabelProps,
	SelectFeatureHandler,
} from "../feature-list-item/types";
import type {FeatureListStateProps} from "./hooks/useFeatureListState";

export type FeatureListItemContextProps = {
	showFeatureListInfo: boolean;
	enableKeyboardControl: boolean;
	selectFeature: SelectFeatureHandler;
	deselectFeature: () => void;
	distanceLabelAs?: ComponentType<FeatureListItemDistanceLabelProps> | null;
	as?: ElementType;
};

export type FeatureListContextValue = {
	state: Omit<FeatureListStateProps, "listUiOptions">;
	listUiOptions: Partial<FullUiState["list"]>;
	enableKeyboardControl: boolean;
	showFeatureListInfo: boolean;
	selectFeature: SelectFeatureHandler;
	deselectFeature: () => void;
	itemProps: FeatureListItemContextProps;
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
