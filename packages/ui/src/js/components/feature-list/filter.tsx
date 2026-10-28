import {memo, useEffect, useRef, useState} from "react";
import {useDispatch, useSelector} from "react-redux";

import {announceStatus} from "../../helpers/announce-status";
import {translate} from "../../helpers/i18n";
import useDebounce from "../../hooks/useDebounce";
import {filterListQuery} from "../../store/actions";
import {listQueryEpochSelector, listQuerySelector} from "../../store/selectors";
import type {MapsightUiStore} from "../../types";
import {useFeatureListContext} from "./context";
import FeaturesQueryInput from "./query-input";

function FeatureFilter() {
	const dispatch = useDispatch<MapsightUiStore["dispatch"]>();
	const listQuery = useSelector(listQuerySelector) ?? "";
	const listQueryEpoch = useSelector(listQueryEpochSelector);
	const ownWriteRef = useRef(false);
	const {
		state: {featureCount, features},
	} = useFeatureListContext();
	const totalFeatureCount = features.length;
	const resultKey = JSON.stringify([
		listQuery,
		featureCount,
		totalFeatureCount,
	]);
	const announcedResult = useRef(resultKey);

	const [input, setInput] = useState(listQuery);
	const [seenEpoch, setSeenEpoch] = useState(listQueryEpoch);

	if (listQueryEpoch !== seenEpoch) {
		setSeenEpoch(listQueryEpoch);
		if (ownWriteRef.current) {
			ownWriteRef.current = false;
		} else {
			setInput(listQuery);
		}
	}

	const debouncedInput = useDebounce(input, 200);

	useEffect(() => {
		if (debouncedInput !== input) {
			return;
		}
		if (debouncedInput !== "") {
			ownWriteRef.current = true;
			dispatch(filterListQuery(debouncedInput));
		}
	}, [dispatch, debouncedInput, input]);

	// needed to "override" debounce if the value is ""
	useEffect(() => {
		if (input === "") {
			ownWriteRef.current = true;
			dispatch(filterListQuery(""));
		}
	}, [dispatch, input]);

	useEffect(() => {
		// Wait for the query debounce and the resulting list render. In
		// particular, never announce an older query while typing continues.
		if (input !== listQuery || announcedResult.current === resultKey) {
			return;
		}
		const timer = setTimeout(() => {
			announceStatus(
				featureCount === 0
					? translate("ui.feature-list.filter.empty")
					: translate("ui.feature-list.filter.status")
							.replace("{n}", String(featureCount))
							.replace("{total}", String(totalFeatureCount)),
			);
			announcedResult.current = resultKey;
		}, 300);
		return () => clearTimeout(timer);
	}, [input, listQuery, resultKey, featureCount, totalFeatureCount]);

	return (
		<div className="ms3-list__filter-box">
			<FeaturesQueryInput query={input} onChange={setInput} />
		</div>
	);
}

export default memo(FeatureFilter);
