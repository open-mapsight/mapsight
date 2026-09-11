import {memo, useEffect, useRef, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import useDebounce from "../../hooks/useDebounce";

import {filterListQuery} from "../../store/actions";
import {
	listQueryEpochSelector,
	listQuerySelector,
} from "../../store/selectors";

import FeaturesQueryInput from "./query-input";

function FeatureFilter() {
	const dispatch = useDispatch();
	const listQuery = useSelector(listQuerySelector) ?? "";
	const listQueryEpoch = useSelector(listQueryEpochSelector);
	const ownWriteRef = useRef(false);

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

	return (
		<div className="ms3-list__filter-box">
			<FeaturesQueryInput query={input} onChange={setInput} />
		</div>
	);
}

export default memo(FeatureFilter);
