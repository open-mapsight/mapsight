import {memo, useCallback, useEffect, useRef} from "react";
import {useDispatch, useSelector} from "react-redux";

import {translate} from "../../helpers/i18n";
import useDebounce from "../../hooks/useDebounce";
import {search} from "../../store/actions";
import {searchQuerySelector} from "../../store/selectors";

import SearchQueryInput from "./query-input";
import SearchResult from "./result";
import useHandleEscapeKeyDown from "../../hooks/useHandleEscapeKeyDown";

const preventDefault = (e) => e.preventDefault();

function Search({closeSearch, autoFocus}) {
	const dispatch = useDispatch();
	const query = useSelector(searchQuerySelector);

	const debouncedQuery = useDebounce(query, 200);
	useEffect(() => {
		if (debouncedQuery !== "") {
			dispatch(search(debouncedQuery));
		}
	}, [dispatch, debouncedQuery]);

	// needed to "override" debounce if the value is ""
	useEffect(() => {
		if (query === "") {
			dispatch(search(query));
		}
	}, [dispatch, query]);

	const handleInput = useCallback(
		(searchQuery) => {
			dispatch({type: "SEARCH", query: searchQuery}); // action without ajax side effect
		},
		[dispatch],
	);

	const inputRef = useRef();

	useHandleEscapeKeyDown(
		inputRef,
		useCallback(() => dispatch(search(""), [dispatch])),
	);

	const handleReturnFocus = useCallback(() => inputRef.current?.focus(), []);

	return (
		<form className="ms3-search" onSubmit={preventDefault}>
			<div className="ms3-search__query-input">
				<SearchQueryInput
					ref={inputRef}
					query={query}
					onChange={handleInput}
					name="search"
					autoFocus={autoFocus}
				/>

				<button className="ms3-search__send-button" type="submit">
					<span className="ms3-visuallyhidden">
						{translate("ui.search.send")}
					</span>
				</button>
			</div>

			{query && (
				<output
					className="ms3-search__output"
					name="search-output"
					htmlFor="search"
				>
					<SearchResult
						onReturnFocus={handleReturnFocus}
						closeSearch={closeSearch}
					/>
				</output>
			)}
		</form>
	);
}

export default memo(Search);
