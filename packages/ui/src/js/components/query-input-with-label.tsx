import type {ChangeEvent, ReactNode} from "react";
import {useCallback, useRef} from "react";
import {useId} from "react-aria";

import {translate} from "../helpers/i18n";

export type Props = {
	label: ReactNode;
	placeholder?: string;
	query: string;
	onChange: (query: string) => void;
};

/**
 * Same as `QueryInput` but with the label prepended and visible. Not possible to change
 * `QueryInput` into something like this due to leaky abstractions
 * (leaking internas like classnames)
 **/
function QueryInputWithLabel({label, placeholder, query, onChange}: Props) {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleInput = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
		[onChange],
	);

	const handleReset = useCallback(() => {
		onChange("");
		inputRef.current?.focus();
	}, [onChange, inputRef]);

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

export default QueryInputWithLabel;
