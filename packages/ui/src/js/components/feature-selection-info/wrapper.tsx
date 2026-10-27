import {type HTMLAttributes, forwardRef} from "react";
import {useObjectRef} from "react-aria";

import useFocusScopeTarget from "../../hooks/useFocusScopeTarget";

type Props = HTMLAttributes<HTMLDivElement> & {
	enableKeyboardControl: boolean;
	fallbackFocus?: () => void;
};

const Wrapper = forwardRef<HTMLDivElement, Props>(function Wrapper(
	{enableKeyboardControl, fallbackFocus, className = "", ...attrs},
	forwardedRef,
) {
	const ref = useObjectRef(forwardedRef);
	useFocusScopeTarget({
		scopeRef: ref,
		initialFocusRef: enableKeyboardControl ? ref : undefined,
		fallbackFocus,
	});
	return (
		<div
			ref={ref}
			className={`ms3-feature-selection-info__wrapper ms3-scroll-target ${className}`}
			tabIndex={enableKeyboardControl ? -1 : undefined}
			{...attrs}
		/>
	);
});

export default Wrapper;
