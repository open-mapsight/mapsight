import {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";

import type {ThunkDispatch} from "redux-thunk";

import {async} from "@mapsight/core/lib/base/actions";
import {load} from "@mapsight/core/lib/feature-sources/actions";
import type {Action, State} from "@mapsight/core/types";

import {FEATURE_SOURCES} from "../../../config/constants/controllers";

export default function useAutoloadFeatureSource(
	enabled = false,
	featureSourceId?: string,
) {
	const dispatch = useDispatch<ThunkDispatch<State, unknown, Action>>();
	const needsLoad = useSelector((state: State) => {
		if (!featureSourceId) {
			return false;
		}

		const featureSource = state[FEATURE_SOURCES]?.[featureSourceId];
		return !featureSource?.data && !featureSource?.isLoading;
	});

	useEffect(() => {
		if (enabled && featureSourceId && needsLoad) {
			dispatch(async(load(FEATURE_SOURCES, featureSourceId)));
		}
	}, [enabled, featureSourceId, needsLoad, dispatch]);
}
