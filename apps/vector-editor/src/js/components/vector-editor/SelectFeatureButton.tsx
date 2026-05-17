import ButtonWithStatus from "./ButtonWithStatus.tsx";

function SelectFeatureButton({
	currentMode,
	mode,
	setMode,
	...props
}: {
	currentMode: string;
	mode: string;
	setMode: (mode: string) => void;
}) {
	const handleClick = () => {
		setMode(mode);
	};

	return (
		<ButtonWithStatus
			isActive={currentMode === mode}
			onClick={handleClick}
			{...props}
		/>
	);
}

export default SelectFeatureButton;
