import {memo, useEffect, useRef, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import useDebounce from "../../hooks/useDebounce";

import {filterListQuery} from "../../store/actions";
import {listQuerySelector} from "../../store/selectors";

import FeaturesQueryInput from "./query-input";

function FeatureFilter() {
	const dispatch = useDispatch();
	const listQuery = useSelector(listQuerySelector) ?? "";

	const [input, setInput] = useState(listQuery);
	const debouncedInput = useDebounce(input, 200);
	const lastDispatchedQuery = useRef(listQuery);

	useEffect(() => {
		if (listQuery !== lastDispatchedQuery.current) {
			setInput(listQuery);
			lastDispatchedQuery.current = listQuery;
		}
	}, [listQuery]);

	useEffect(() => {
		if (debouncedInput !== "") {
			lastDispatchedQuery.current = debouncedInput;
			dispatch(filterListQuery(debouncedInput));
		}
	}, [dispatch, debouncedInput]);

	// needed to "override" debounce if the value is ""
	useEffect(() => {
		if (input === "") {
			lastDispatchedQuery.current = "";
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
