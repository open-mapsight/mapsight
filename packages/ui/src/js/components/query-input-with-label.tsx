import type {ChangeEvent, KeyboardEvent, ReactNode} from "react";
import {useCallback, useLayoutEffect, useRef, useState} from "react";
import {useId} from "react-aria";

import {useFutureFlag} from "../future/context";
import {translate} from "../helpers/i18n";

export type Props = {
	label: ReactNode;
	placeholder?: string;
	query: string;
	onChange: (query: string) => void;
};

/**
 * List text search. Distinct from the map/places search overlay.
 * Default keeps a visible label + input for 7.x host CSS.
 * `future.v8_listSearchButton` expands from a labeled button. Removed in v8.
 **/
function QueryInputWithLabel({label, placeholder, query, onChange}: Props) {
	const listSearchButton = useFutureFlag("v8_listSearchButton");
	return listSearchButton ? (
		<ListSearchButtonInput
			label={label}
			placeholder={placeholder}
			query={query}
			onChange={onChange}
		/>
	) : (
		<VisibleLabelInput
			label={label}
			placeholder={placeholder}
			query={query}
			onChange={onChange}
		/>
	);
}

function VisibleLabelInput({label, placeholder, query, onChange}: Props) {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleInput = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
		[onChange],
	);

	const handleReset = useCallback(() => {
		onChange("");
		inputRef.current?.focus();
	}, [onChange]);

	const inputId = useId();

	return (
		<fieldset className="ms3-query-input-with-label">
			<label
				className="ms3-query-input-with-label__label"
				htmlFor={inputId}
			>
				{label}
			</label>

			<div className="ms3-query-input-with-label__input-container">
				<input
					id={inputId}
					ref={inputRef}
					className="ms3-query-input-with-label__input"
					placeholder={placeholder}
					type="search"
					value={query}
					onChange={handleInput}
					autoComplete="off"
				/>

				{query !== "" && (
					<button
						className="ms3-query-input-with-label__reset-button"
						type="button"
						onClick={handleReset}
					>
						<span className="ms3-visuallyhidden">
							{translate("ui.query-input.reset")}
						</span>
					</button>
				)}
			</div>
		</fieldset>
	);
}

function ListSearchButtonInput({label, placeholder, query, onChange}: Props) {
	const inputRef = useRef<HTMLInputElement>(null);
	const openButtonRef = useRef<HTMLButtonElement>(null);
	const pendingFocusRef = useRef(false);
	const pendingTriggerFocusRef = useRef(false);
	const [open, setOpen] = useState(() => query !== "");
	const expanded = open || query !== "";

	const handleInput = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
		[onChange],
	);

	const handleReset = useCallback(() => {
		setOpen(true);
		onChange("");
		inputRef.current?.focus();
	}, [onChange]);

	const handleOpen = useCallback(() => {
		pendingFocusRef.current = true;
		setOpen(true);
	}, []);

	const handleFocus = useCallback(() => {
		setOpen(true);
	}, []);

	const handleBlur = useCallback(() => {
		setOpen(false);
	}, []);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Escape" && query === "") {
				e.preventDefault();
				e.stopPropagation();
				pendingTriggerFocusRef.current = true;
				setOpen(false);
			}
		},
		[query],
	);

	useLayoutEffect(() => {
		if (pendingFocusRef.current && inputRef.current) {
			pendingFocusRef.current = false;
			inputRef.current.focus();
			return;
		}
		if (pendingTriggerFocusRef.current && openButtonRef.current) {
			pendingTriggerFocusRef.current = false;
			openButtonRef.current.focus();
		}
	}, [open, expanded]);

	const inputId = useId();

	return (
		<fieldset className="ms3-query-input-with-label ms3-query-input-with-label--list-search-button">
			<label
				className="ms3-query-input-with-label__label ms3-visuallyhidden"
				htmlFor={inputId}
			>
				{label}
			</label>

			<div className="ms3-query-input-with-label__input-container">
				<button
					ref={openButtonRef}
					className={
						expanded
							? "ms3-visuallyhidden"
							: "ms3-query-input-with-label__open"
					}
					type="button"
					aria-expanded={expanded}
					aria-controls={inputId}
					tabIndex={expanded ? -1 : undefined}
					onClick={handleOpen}
				>
					<span className="ms3-query-input-with-label__open-label">
						{label}
					</span>
				</button>

				<input
					id={inputId}
					ref={inputRef}
					className="ms3-query-input-with-label__input"
					placeholder={placeholder}
					type="search"
					value={query}
					hidden={!expanded}
					onChange={handleInput}
					onFocus={handleFocus}
					onBlur={handleBlur}
					onKeyDown={handleKeyDown}
					autoComplete="off"
				/>

				{expanded && query !== "" ? (
					<button
						className="ms3-query-input-with-label__reset-button"
						type="button"
						onMouseDown={(e) => e.preventDefault()}
						onClick={handleReset}
					>
						<span className="ms3-visuallyhidden">
							{translate("ui.query-input.reset")}
						</span>
					</button>
				) : null}
			</div>
		</fieldset>
	);
}

export default QueryInputWithLabel;
