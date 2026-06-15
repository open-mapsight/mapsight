import {
	ICON_BACKGROUND_PALETTE,
	ICON_FOREGROUND_PALETTE,
} from "./icon-color-palette.ts";
import {IconColorPicker} from "./icon-color-picker.tsx";
import {DEFAULT_ICON_BACKGROUND} from "./map-config.ts";

export function IconColorControls({
	background,
	foreground,
	foregroundIsAuto,
	onBackgroundChange,
	onBackgroundReset,
	onForegroundChange,
	onForegroundReset,
}: {
	background: string;
	foreground: string;
	foregroundIsAuto: boolean;
	onBackgroundChange: (color: string) => void;
	onBackgroundReset: () => void;
	onForegroundChange: (color: string) => void;
	onForegroundReset: () => void;
}) {
	return (
		<div className="icon-color-controls">
			<IconColorPicker
				id="background"
				label="Background"
				value={background}
				palette={ICON_BACKGROUND_PALETTE}
				onChange={onBackgroundChange}
				onReset={onBackgroundReset}
				resetDisabled={background === DEFAULT_ICON_BACKGROUND}
			/>
			<IconColorPicker
				id="foreground"
				label={
					<>
						Foreground
						{foregroundIsAuto ? (
							<span className="field__hint"> (auto)</span>
						) : null}
					</>
				}
				value={foreground}
				palette={ICON_FOREGROUND_PALETTE}
				onChange={onForegroundChange}
				onReset={onForegroundReset}
				resetDisabled={foregroundIsAuto}
				note={
					foregroundIsAuto
						? "Contrast is picked automatically from the background."
						: undefined
				}
			/>
		</div>
	);
}
