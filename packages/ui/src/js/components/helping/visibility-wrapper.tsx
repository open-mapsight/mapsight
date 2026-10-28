import type {PropsWithChildren} from "react";
import {Fragment, memo} from "react";
import {useSelector} from "react-redux";

import type {RootStateSlice} from "../../store/selectors";

function VisibilityWrapper<State = RootStateSlice>({
	children,
	visibleSelector,
}: PropsWithChildren<{visibleSelector: (state: State) => boolean}>) {
	const visible = useSelector(visibleSelector);
	if (visible) {
		// we're using `Fragment` here to convert `ReactNode` to a `ReactElement`
		return <Fragment>{children}</Fragment>;
	}

	return null;
}

export default memo(VisibilityWrapper) as typeof VisibilityWrapper;
