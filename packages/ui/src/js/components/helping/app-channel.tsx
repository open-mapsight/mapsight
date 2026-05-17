import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
} from "react";

import type {AppChannelListenerDefinition} from "../../types";

/**
 * App-wide event channel
 */
const AppChannelContext = createContext<EventTarget | null>(null);
AppChannelContext.displayName = "AppChannelContext";

export const APP_EVENT_PARTIAL_CONTENT_CHANGED = "partialContentChanged";
export const APP_EVENT_FOCUS_MAP = "focusMap";
export const APP_EVENT_FOCUS_FEATURE_LIST = "focusFeatureList";
export const APP_EVENT_SCROLL_TO_MAP = "scrollToMap";
export const APP_EVENT_SCROLL_TO_FEATURE_LIST = "scrollToFeatureList";

/**
 * @returns {EventTarget} app channel
 */
function createAppChannel() {
	return new EventTarget();
}

export function AppChannelProvider({
	children,
	listeners = [],
}: {
	children?: ReactNode;
	listeners?: AppChannelListenerDefinition[];
}) {
	const appChannel = useMemo(() => createAppChannel(), []);

	useEffect(() => {
		listeners.forEach(([eventName, eventListener]) => {
			appChannel.addEventListener(eventName, eventListener);
		});

		return () => {
			listeners.forEach(([eventName, eventListener]) => {
				appChannel.removeEventListener(eventName, eventListener);
			});
		};
	}, [appChannel, listeners]);

	return (
		<AppChannelContext.Provider value={appChannel}>
			{children}
		</AppChannelContext.Provider>
	);
}

/**
 * App-wide event channel
 *
 * @returns {EventTarget} app channel
 */
function useAppChannel() {
	return useContext(AppChannelContext);
}

/**
 * @returns {(Event) => void} dispatch function for the app channel
 */
export function useAppChannelDispatchEvent() {
	const appChannel = useAppChannel();

	return useCallback(
		(event) => {
			console.info("@mapsight/ui: app channel event", event.type, event);
			appChannel?.dispatchEvent(event);
		},
		[appChannel],
	);
}

/**
 * Adds and removes event listener to the app channel
 *
 * @param {string} event event name
 * @param {EventListener} eventListener event listener
 */
export function useAppChannelEventListener(event, eventListener) {
	const appChannel = useAppChannel();

	useEffect(() => {
		appChannel?.addEventListener(event, eventListener);

		return () => {
			appChannel?.removeEventListener(event, eventListener);
		};
	}, [appChannel, event, eventListener]);
}
