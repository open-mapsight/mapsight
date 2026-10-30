import type {ElementType, FormEvent, KeyboardEvent} from "react";
import {memo, useCallback, useEffect, useRef} from "react";
import {useDispatch, useSelector} from "react-redux";

import {announceStatus} from "../../helpers/announce-status";
import getFeatureProperty from "../../helpers/get-feature-property";
import {translate} from "../../helpers/i18n";
import useDebounce from "../../hooks/useDebounce";
import useHandleEscapeKeyDown from "../../hooks/useHandleEscapeKeyDown";
import {search} from "../../store/actions";
import {searchQuerySelector} from "../../store/selectors";
import type {MapsightUiFeature, MapsightUiStore} from "../../types";
import SearchQueryInput from "./query-input";
import SearchResult from "./result";
import SearchStatus from "./status";

export type SearchProps = {
	closeSearch?: () => void;
	autoFocus?: boolean;
	announceResults?: boolean;
	onResultSelected?: (feature: MapsightUiFeature) => void;
	groupHeadlineAs?: ElementType;
	/** Render a div when embedded inside a host form; use the same value during SSR. */
	renderForm?: boolean;
};

const preventDefault = (e: FormEvent<HTMLElement>) => e.preventDefault();

/**
 * announceResults=false lets hosts provide their own search status.
 * onResultSelected runs after the selection has rendered. Hosts can move focus
 * there; otherwise visible details/the selected row, then the input, receive it.
 * groupHeadlineAs accepts a heading tag or a non-heading label such as "div".
 */
function Search({
	closeSearch,
	autoFocus,
	announceResults = true,
	onResultSelected,
	groupHeadlineAs = undefined,
	renderForm = true,
}: SearchProps) {
	const dispatch = useDispatch<MapsightUiStore["dispatch"]>();
	const query = useSelector(searchQuerySelector) ?? "";

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
		(searchQuery: string) => {
			dispatch({type: "SEARCH", query: searchQuery}); // action without ajax side effect
		},
		[dispatch],
	);

	const inputRef = useRef<HTMLInputElement>(null);

	useHandleEscapeKeyDown(
		inputRef,
		useCallback(() => dispatch(search("")), [dispatch]),
	);

	const handleResultSelected = useCallback(
		(feature: MapsightUiFeature) => {
			const input = inputRef.current;
			const scope = input?.closest(".ms3-search");
			const root = input?.closest(".ms3-wrapper");
			// Redux clears the query and removes the result button in this commit.
			setTimeout(() => {
				const previousFocus = document.activeElement;
				onResultSelected?.(feature);
				const focused = document.activeElement;
				if (
					focused &&
					focused !== document.body &&
					focused.isConnected &&
					(focused !== previousFocus || !scope?.contains(focused))
				) {
					return;
				}
				const targets = root?.querySelectorAll<HTMLElement>(
					".ms3-feature-selection-info__wrapper, .ms3-list__item--selected",
				);
				const target = Array.from(targets || []).find(
					(element) =>
						!element.closest(
							"[hidden], [inert], [aria-hidden='true']",
						) &&
						element.getClientRects().length > 0 &&
						getComputedStyle(element).visibility !== "hidden",
				);
				if (target) {
					target.setAttribute("tabindex", "-1");
					target.focus();
				} else if (input?.isConnected) {
					input.focus();
					if (announceResults) {
						announceStatus(
							translate("ui.search.result.selected").replace(
								"{name}",
								getFeatureProperty(feature, "name") as string,
							),
						);
					}
				}
			}, 0);
		},
		[announceResults, onResultSelected],
	);

	const handleReturnFocus = useCallback(() => inputRef.current?.focus(), []);

	const Container = renderForm ? "form" : "div";
	// Like the prevented form submit: keep Enter from submitting a host form.
	// The debounced query already runs the search.
	const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		if (
			!renderForm &&
			event.key === "Enter" &&
			event.target === inputRef.current &&
			!event.nativeEvent.isComposing
		) {
			event.preventDefault();
		}
	};

	return (
		<Container
			className="ms3-search"
			onSubmit={preventDefault}
			onKeyDown={onKeyDown}
		>
			<div className="ms3-search__query-input">
				<SearchQueryInput
					ref={inputRef}
					query={query}
					onChange={handleInput}
					name="search"
					autoFocus={autoFocus}
				/>

				<button
					className="ms3-search__send-button"
					type={renderForm ? "submit" : "button"}
				>
					<span className="ms3-visuallyhidden">
						{translate("ui.search.send")}
					</span>
				</button>
			</div>

			{announceResults && <SearchStatus />}

			{query && (
				<div className="ms3-search__output">
					<SearchResult
						onReturnFocus={handleReturnFocus}
						closeSearch={closeSearch}
						onResultSelected={handleResultSelected}
						groupHeadlineAs={groupHeadlineAs}
					/>
				</div>
			)}
		</Container>
	);
}

export default memo(Search);
