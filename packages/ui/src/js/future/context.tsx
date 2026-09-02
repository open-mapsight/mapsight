import {createContext, useContext} from "react";

import type {FutureFlags} from "../types";

export const EMPTY_FUTURE_FLAGS: FutureFlags = {};

export const FutureFlagsContext =
	createContext<FutureFlags>(EMPTY_FUTURE_FLAGS);
FutureFlagsContext.displayName = "FutureFlagsContext";

export function useFutureFlag(flag: keyof FutureFlags): boolean {
	return useContext(FutureFlagsContext)[flag] === true;
}
