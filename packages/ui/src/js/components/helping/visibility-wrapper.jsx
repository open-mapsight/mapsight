import  {Fragment, memo} from "react";
import {useSelector} from "react-redux";

/**
 * VisibilityWrapper
 *
 * @param {{
 *   visibleSelector: (state: any) => boolean,
 *   children: React.ReactNode
 * }} props props
 * @returns {React.ReactElement | null} element
 */
function VisibilityWrapper({children, visibleSelector}) {
	const visible = useSelector(visibleSelector);
	if (visible) {
		// we're using `Fragment` here to convert `ReactNode` to a `ReactElement`
		return <Fragment>{children}</Fragment>;
	}

	return null;
}

export default memo(VisibilityWrapper);
