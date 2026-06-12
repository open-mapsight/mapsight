import {type ReactElement} from "react";

export function ColorDot({
	color,
	isEnabled = true,
}: {
	color: string;
	isEnabled?: boolean;
}): ReactElement {
	return (
		<span
			className="msca:mr-2 msca:inline-block msca:h-3 msca:w-3 msca:shrink-0 msca:rounded-full"
			style={{
				backgroundColor: color,
				opacity: isEnabled ? 1 : 0.35,
			}}
		/>
	);
}
