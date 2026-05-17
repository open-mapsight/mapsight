import {useCallback} from "react";

import {EDITOR_MODE} from "@mapsight/core/mixins/EditorMixin";

import ButtonWithStatus, {
	type ButtonWithStatusProps,
} from "./ButtonWithStatus.tsx";

type ModeButtonProps = ButtonWithStatusProps & {
	currentMode: string | null;
	mode: string;
	setMode: (mode: string) => void;
};

const ModeButton = ({
	currentMode,
	mode,
	setMode,
	...props
}: ModeButtonProps) => {
	const handleClick = useCallback(() => setMode(mode), [mode, setMode]);

	return (
		<ButtonWithStatus
			isActive={currentMode === mode}
			onClick={handleClick}
			{...props}
		/>
	);
};
ModeButton.Navigate = (props: Omit<ModeButtonProps, "mode">) =>
	ModeButton({mode: EDITOR_MODE.NAVIGATE, ...props});
ModeButton.DrawPoint = (props: Omit<ModeButtonProps, "mode">) =>
	ModeButton({mode: EDITOR_MODE.DRAW_POINT, ...props});
ModeButton.DrawLineString = (props: Omit<ModeButtonProps, "mode">) =>
	ModeButton({mode: EDITOR_MODE.DRAW_LINESTRING, ...props});
ModeButton.DrawPolygon = (props: Omit<ModeButtonProps, "mode">) =>
	ModeButton({mode: EDITOR_MODE.DRAW_POLYGON, ...props});
ModeButton.Modify = (props: Omit<ModeButtonProps, "mode">) =>
	ModeButton({mode: EDITOR_MODE.MODIFY, ...props});
ModeButton.Translate = (props: Omit<ModeButtonProps, "mode">) =>
	ModeButton({mode: EDITOR_MODE.TRANSLATE, ...props});
ModeButton.Select = (props: Omit<ModeButtonProps, "mode">) =>
	ModeButton({mode: EDITOR_MODE.SELECT, ...props});

export default ModeButton;
