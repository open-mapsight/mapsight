import type {ChangeEvent, KeyboardEvent, ReactNode} from "react";
import {useCallback, useLayoutEffect, useRef, useState} from "react";
import {useId} from "react-aria";

import {translate} from "../helpers/i18n";

export type Props = {
	label: ReactNode;
	placeholder?: string;
	query: string;
	onChange: (query: string) => void;
};

/**
 * List text search: collapsed labeled button, then a focused input in the same
 * icon slot. Distinct from the map/places search overlay.
 **/
function QueryInputWithLabel({label, placeholder, query, onChange}: Props) {
	const inputRef = useRef<HTMLInputElement>(null);
	const pendingFocusRef = useRef(false);
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
				setOpen(false);
			}
		},
		[query],
	);

	useLayoutEffect(() => {
		if (pendingFocusRef.current && inputRef.current) {
			pendingFocusRef.current = false;
			inputRef.current.focus();
		}
	}, [open]);

	const inputId = useId();

	return (
		<fieldset className="ms3-query-input-with-label">
			{expanded ? (
				<label
					className="ms3-query-input-with-label__label ms3-visuallyhidden"
					htmlFor={inputId}
				>
					{label}
				</label>
			) : null}

			<div className="ms3-query-input-with-label__input-container">
				{expanded ? (
					<>
						<input
							id={inputId}
							ref={inputRef}
							className="ms3-query-input-with-label__input"
							placeholder={placeholder}
							type="search"
							value={query}
							onChange={handleInput}
							onFocus={handleFocus}
							onBlur={handleBlur}
							onKeyDown={handleKeyDown}
							autoComplete="off"
						/>

						{query !== "" && (
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
						)}
					</>
				) : (
					<button
						className="ms3-query-input-with-label__open"
						type="button"
						onClick={handleOpen}
					>
						<span className="ms3-query-input-with-label__open-label">
							{label}
						</span>
					</button>
				)}
			</div>
		</fieldset>
	);
}

export default QueryInputWithLabel;
