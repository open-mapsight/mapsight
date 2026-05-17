import {createContext, useContext, useMemo} from "react";
import {useSelector} from "react-redux";

import {createMainPanelContentTypeSelector} from "../../store/selectors.ts";

/** @type {import('react').Context<import('../../types').MainPanelContextValue>} */
const MainPanelContext = createContext(
	/** @type {import('../../types').MainPanelContextValue} */ {
		showSelectionInfo: false,
		showList: false,
		collapsible: false,
		panelPosition: "left",

		feature: null,
		contentType: null,
		collapsed: false,
	},
);
MainPanelContext.displayName = "MainPanelContext";

/** @returns {import('../../types').MainPanelContextValue} main panel context */
export function useMainPanelContext() {
	return useContext(MainPanelContext);
}

/**
 * @param {Pick<import('../../types').MainPanelContextOptions, 'showSelectionInfo'| 'showList' | 'collapsible'>} options main panel options
 * @returns {import('../../types').MainPanelContextState} main panel state
 */
function useMainPanelState({showSelectionInfo, showList, collapsible}) {
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

export function MainPanelContextProvider(
	/** @type {import('../../types').MainPanelContextOptions & {children: import('react').ReactChildren}} */ {
		showSelectionInfo = false,
		showList = false,
		collapsible = false,
		panelPosition = "left",
		children,
	},
) {
	const options = {
		showSelectionInfo: showSelectionInfo,
		showList: showList,
		collapsible: collapsible,
		panelPosition: panelPosition,
	};
	const state = useMainPanelState(options);
	const value = {...options, ...state};

	return <MainPanelContext.Provider value={value}>{children}</MainPanelContext.Provider>;
}
