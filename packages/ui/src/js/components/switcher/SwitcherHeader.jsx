import  {Fragment, memo} from "react";

import SwitcherButton from "./SwitcherButton";

function SwitcherHeader(props) {
	const {
		as: T = "h3",
		baseClass = "ms3-switcher-header",
		label,
		toggleActive = null,
		active = true,
		count = null,
		...attributes
	} = props;

	const activeClassModified = active ? "active" : "inactive";
	if (T !== Fragment) {
		attributes.className = `[ ${baseClass} ${baseClass}--${activeClassModified} ] ${
			attributes.className || ""
		}`;
	}

	if (toggleActive) {
		return (
			<T {...attributes}>
				<SwitcherButton
					status={activeClassModified}
					toggleActive={toggleActive}
					active={active}
				>
					<span className={`${baseClass}__label`}>{label}</span>

					{!!count && (
						<span
							className={`${baseClass}__count`}
							data-ms3-count={count}
						>
							{count}
						</span>
					)}
				</SwitcherButton>
			</T>
		);
	}

	return (
		<T {...attributes}>
			<span className={`${baseClass}__label`}>{label}</span>
			{!!count && (
				<span className={`${baseClass}__count`} data-ms3-count={count}>
					{count}
				</span>
			)}
		</T>
	);
}

export default memo(SwitcherHeader);
