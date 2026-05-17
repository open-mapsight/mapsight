import {memo, useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import useDebounce from "../../hooks/useDebounce";

import {filterListQuery} from "../../store/actions.ts";
import {listQuerySelector} from "../../store/selectors.ts";

import FeaturesQueryInput from "./query-input";

function FeatureFilter() {
	const dispatch = useDispatch();

	const [input, setInput] = useState(useSelector(listQuerySelector));
	const debouncedInput = useDebounce(input, 200);
	useEffect(() => {
		if (debouncedInput !== "") {
			dispatch(filterListQuery(debouncedInput));
		}
	}, [dispatch, debouncedInput]);

	// needed to "override" debounce if the value is ""
	useEffect(() => {
		if (input === "") {
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
