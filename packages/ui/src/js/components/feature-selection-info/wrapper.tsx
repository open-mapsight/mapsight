import {type HTMLAttributes, forwardRef, useEffect} from "react";
import {useObjectRef} from "react-aria";

import {FocusTrap} from "focus-trap-react";

import usePrevious from "../../hooks/usePrevious";
import type {MapsightUiFeature} from "../../types";

type Props = HTMLAttributes<HTMLDivElement> & {
	enableKeyboardControl: boolean;
	feature: MapsightUiFeature | null;
	trapFocus?: boolean;
	onBeforeFocus?: (panel: HTMLElement) => void;
};

const Wrapper = forwardRef<HTMLDivElement, Props>(function Wrapper(
	{
		enableKeyboardControl,
		feature,
		trapFocus = false,
		onBeforeFocus,
		className = "",
		...attrs
	},
	forwardedRef,
) {
	const ref = useObjectRef(forwardedRef);
	const previousFeature = usePrevious(feature);
	const previousEnabled = usePrevious(enableKeyboardControl);

	useEffect(() => {
		if (
			feature &&
			ref.current &&
			(feature !== previousFeature ||
				(enableKeyboardControl && !previousEnabled))
		) {
			onBeforeFocus?.(ref.current);
			if (enableKeyboardControl) {
				ref.current.focus({preventScroll: true});
			}
		}
	}, [
		enableKeyboardControl,
		feature,
		onBeforeFocus,
		previousEnabled,
		previousFeature,
		ref,
	]);

	return (
		<FocusTrap
			active={enableKeyboardControl && trapFocus}
			focusTrapOptions={{
				clickOutsideDeactivates: true,
				escapeDeactivates: false,
				returnFocusOnDeactivate: false,
				initialFocus: false,
				fallbackFocus: () => ref.current!,
			}}
		>
			<div
				ref={ref}
				className={`ms3-feature-selection-info__wrapper ms3-scroll-target ${className}`}

				tabIndex={enableKeyboardControl ? -1 : undefined}
				{...attrs}
			/>
		</FocusTrap>
	);
});

export default Wrapper;
