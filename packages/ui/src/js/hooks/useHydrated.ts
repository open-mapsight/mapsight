import {useSyncExternalStore} from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/** Browser capabilities are available only after the server tree has hydrated. */
export default function useHydrated(): boolean {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
