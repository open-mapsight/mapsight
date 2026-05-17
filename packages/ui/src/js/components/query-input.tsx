import type {ChangeEvent, ReactNode} from "react";
import {forwardRef, useCallback, useRef} from "react";

import {translate} from "../helpers/i18n";
import {forwardRefValue} from "../helpers/react";

/* NOTE: for attribute not required because of nesting */

export type Props = {
	label: ReactNode;
	placeholder?: string;
	className?: string;
	groupClassName?: string;
	resetButtonClassName?: string;
	name?: string;
	query: string;
	onChange: (query: string) => void;
	autoFocus?: boolean;
};

const QueryInput = forwardRef<HTMLInputElement, Props>(function QueryInput(
	{
		label,
		placeholder,
		className,
		groupClassName,
		resetButtonClassName,
		name,
		query,
		onChange,
		autoFocus,
	},
	forwardedRef,
) {
	const inputRef = useRef<HTMLInputElement>(null);
	forwardRefValue(inputRef, forwardedRef);

	const handleInput = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
		[onChange],
	);

	const handleReset = useCallback(() => {
		onChange("");
		inputRef.current?.focus();
	}, [onChange, inputRef]);

	return (
		<fieldset className={groupClassName}>
			<label>
				<span className="ms3-visuallyhidden">{label}</span>

				<input
					ref={inputRef}
					className={className}
					placeholder={placeholder}
					type="search"
					name={name}
					value={query}
					onChange={handleInput}
					autoComplete="off"
					autoFocus={autoFocus}
				/>
			</label>

			{query !== "" && (
				<button
					className={resetButtonClassName}
					type="button"
					onClick={handleReset}
				>
					<span className="ms3-visuallyhidden">
						{translate("ui.query-input.reset")}
					</span>
				</button>
			)}
		</fieldset>
	);
});

export default QueryInput;
