import {useEffect} from "react";
import {useDispatch} from "react-redux";

import type {AnyAction} from "@reduxjs/toolkit";

import {async} from "@mapsight/core/lib/base/actions";
import {load} from "@mapsight/core/lib/feature-sources/actions";

import {FEATURE_SOURCES} from "../../../config/constants/controllers";

export default function useAutoloadFeatureSource(
	enabled = false,
	featureSourceId?: string,
) {
	const dispatch = useDispatch();
	useEffect(() => {
		if (enabled && featureSourceId) {
			dispatch(
				async(
					load(FEATURE_SOURCES, featureSourceId),
				) as unknown as AnyAction,
			);
		}
	}, [enabled, featureSourceId, dispatch]);
}
