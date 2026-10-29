import {createContext, useContext} from "react";

export const CitationPictogramIdsContext = createContext<readonly string[]>([]);
CitationPictogramIdsContext.displayName = "CitationPictogramIdsContext";

export function useHostCitationPictogramIds(): readonly string[] {
	return useContext(CitationPictogramIdsContext);
}
