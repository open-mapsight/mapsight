import {forwardRef, useEffect, useRef} from "react";

import usePrevious from "../../hooks/usePrevious";

function useAutofocus(enabled, ref, feature) {
	const previousFeature = usePrevious(feature);
	const previousRef = usePrevious(ref.current);

	useEffect(() => {
		if (!enabled || !feature || !ref.current) {
			return;
		}

		// Autofocus on mount or if feature is selected
		if (
			feature &&
			(ref.current !== previousRef || feature !== previousFeature)
		) {
			//ref.current.scrollIntoView({block: 'start', behavior: 'smooth'});
			ref.current.focus({preventScroll: true});
		}
	}, [enabled, feature, previousFeature, previousRef, ref]);
}

const Wrapper = forwardRef(function Wrapper(
	{enableKeyboardControl, feature, className = "", ...attrs},
	forwardedRef,
) {
	const ownRef = useRef();
	const ref = forwardedRef || ownRef;
	useAutofocus(enableKeyboardControl, ref, feature);

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
