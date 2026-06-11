import {type ReactNode, useId, useState} from "react";

function normalizeHex(value: string): string | null {
	const trimmed = value.trim().toLowerCase();

	if (/^#[0-9a-f]{6}$/.test(trimmed)) {
		return trimmed;
	}

	const shortMatch = trimmed.match(/^#?([0-9a-f])([0-9a-f])([0-9a-f])$/);
	if (shortMatch) {
		const [, red, green, blue] = shortMatch;
		return `#${red}${red}${green}${green}${blue}${blue}`;
	}

	const bareMatch = trimmed.match(/^([0-9a-f]{6})$/);
	if (bareMatch) {
		return `#${bareMatch[1]}`;
	}

	return null;
}

function colorsMatch(left: string, right: string): boolean {
	return normalizeHex(left) === normalizeHex(right);
}

function HexColorInput({
	id,
	labelText,
	value,
	onChange,
}: {
	id: string;
	labelText: string;
	value: string;
	onChange: (color: string) => void;
}) {
	const [hexInput, setHexInput] = useState(value);

	const commitHexInput = (rawValue: string) => {
		setHexInput(rawValue);
		const normalized = normalizeHex(rawValue);
		if (normalized) {
			onChange(normalized);
		}
	};

	return (
		<input
			id={`${id}-hex`}
			className="color-picker__hex"
			value={hexInput}
			onChange={(event) => commitHexInput(event.target.value)}
			onBlur={(event) => {
				const normalized = normalizeHex(event.target.value);
				setHexInput(normalized ?? value);
			}}
			spellCheck={false}
			aria-label={`${labelText} hex value`}
		/>
	);
}

export function IconColorPicker({
	id,
	label,
	value,
	palette,
	onChange,
	onReset,
	resetDisabled = false,
	note,
}: {
	id: string;
	label: ReactNode;
	value: string;
	palette: readonly string[];
	onChange: (color: string) => void;
	onReset?: () => void;
	resetDisabled?: boolean;
	note?: ReactNode;
}) {
	const paletteId = useId();
	const labelText = typeof label === "string" ? label : id;

	return (
		<div className="field color-picker-field">
			<div className="field__header">
				<label htmlFor={`${id}-hex`}>{label}</label>
				{onReset ? (
					<button
						type="button"
						className="reset-btn"
						onClick={onReset}
						disabled={resetDisabled}
					>
						Reset
					</button>
				) : null}
			</div>

			<div className="color-picker__control">
				<div className="color-picker__value-row">
					<label
						className="color-picker__preview-wrap"
						title="Pick a custom color"
					>
						<span
							className="color-picker__preview"
							style={{backgroundColor: value}}
						/>
						<input
							type="color"
							className="color-picker__native"
							value={value}
							onChange={(event) => onChange(event.target.value)}
							aria-label={`${labelText} color`}
						/>
					</label>
					<HexColorInput
						key={value}
						id={id}
						labelText={labelText}
						value={value}
						onChange={onChange}
					/>
				</div>

				<div
					id={paletteId}
					className="color-picker__palette"
					role="listbox"
					aria-label={`${labelText} palette`}
				>
					{palette.map((color) => {
						const selected = colorsMatch(color, value);

						return (
							<button
								key={color}
								type="button"
								role="option"
								aria-selected={selected}
								className={`color-picker__swatch${selected ? " is-selected" : ""}`}
								style={{backgroundColor: color}}
								title={color}
								onClick={() => onChange(color)}
							>
								<span className="color-picker__swatch-label">
									{color}
								</span>
							</button>
						);
					})}
				</div>
			</div>

			{note ? <span className="field__note">{note}</span> : null}
		</div>
	);
}
