import type {PropsWithChildren} from "react";
import {createContext, useContext, useMemo} from "react";
import {useSelector} from "react-redux";

import {createMainPanelContentTypeSelector} from "../../store/selectors.ts";
import type {
	MainPanelContextOptions,
	MainPanelContextValue,
} from "../../types.ts";

const MainPanelContext = createContext<MainPanelContextValue>({
	showSelectionInfo: false,
	showList: false,
	collapsible: false,
	panelPosition: "left",

	feature: null,
	contentType: null,
	collapsed: false,
});
MainPanelContext.displayName = "MainPanelContext";

export function useMainPanelContext() {
	return useContext(MainPanelContext);
}

type MainPanelStateProps = Pick<
	MainPanelContextOptions,
	"showSelectionInfo" | "showList" | "collapsible"
>;

function useMainPanelState({
	showSelectionInfo,
	showList,
	collapsible,
}: MainPanelStateProps) {
	const selector = useMemo(
		() =>
			createMainPanelContentTypeSelector({
				showSelectionInfo: showSelectionInfo,
				showList: showList,
				collapsible: collapsible,
			}),
		[showSelectionInfo, showList, collapsible],
	);
	return useSelector(selector);
}

type MainPanelContextProps = PropsWithChildren<
	Partial<MainPanelContextOptions>
>;

export function MainPanelContextProvider({
	showSelectionInfo = false,
	showList = false,
	collapsible = false,
	panelPosition = "left",
	children,
}: MainPanelContextProps) {
	const options = {
		showSelectionInfo: showSelectionInfo,
		showList: showList,
		collapsible: collapsible,
		panelPosition: panelPosition,
	};
	const state = useMainPanelState(options);
	const value = {...options, ...state};

	return (
		<MainPanelContext.Provider value={value}>
			{children}
		</MainPanelContext.Provider>
	);
}
