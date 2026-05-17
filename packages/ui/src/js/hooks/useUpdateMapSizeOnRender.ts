import {useEffect} from "react";

import type {Dispatch} from "redux";

import useUpdateMapSizeCallback from "./useUpdateMapSizeCallback";

export default function useUpdateMapSizeOnRender(
	// TODO: use hook
	dispatch: Dispatch<any>,
) {
	const updateMapSize = useUpdateMapSizeCallback(dispatch, undefined, false);
	useEffect(() => {
		console.log("UPDATE MAP SIZE ON RENDER");
		return updateMapSize();
	}, [updateMapSize]);
}
