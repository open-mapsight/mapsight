import type {MouseEventHandler} from "react";
import {memo, useCallback} from "react";
import {useDispatch, useSelector} from "react-redux";

import {translate} from "../../helpers/i18n";
import {toggleUserPreferenceListVisible} from "../../store/actions";
import {userPreferenceListVisibleSelector} from "../../store/selectors";
import {useMainPanelContext} from "./context";

type ListToggleButtonProps = {
	active?: boolean;
	onClick?: MouseEventHandler<HTMLButtonElement>;
};

const ListToggleButton = memo(function ListToggleButton({
	active,
	onClick,
}: ListToggleButtonProps) {
	return (
		<button
			className={`ms3-button [ ms3-list-toggle-button ${
				active ? "ms3-list-toggle-button--active" : ""
			} ]`}
			type="button"
			role="switch"
			aria-checked={!!active}
			onClick={onClick}
		>
			<span className="ms3-visuallyhidden">
				{translate(
					active
						? "ui.main-panel.list-toggle.close"
						: "ui.main-panel.list-toggle.open",
				)}
			</span>
		</button>
	);
});

/**
 * Context-aware toggle used inside {@link MainPanelContainer}.
 */
export function MainPanelListToggleButton() {
	const {collapsible, contentType} = useMainPanelContext();
	const dispatch = useDispatch();
	const active = useSelector(userPreferenceListVisibleSelector);
	const handleClick = useCallback(() => {
		dispatch(toggleUserPreferenceListVisible());
	}, [dispatch]);

	if (collapsible && contentType === "list") {
		return <ListToggleButton active={active} onClick={handleClick} />;
	}

	return null;
}
