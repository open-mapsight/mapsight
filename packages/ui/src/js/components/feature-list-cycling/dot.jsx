import {useCallback, useEffect} from "react";

function FeatureListCyclingDot({
	featureId,
	onFeatureSelection,
	onFeatureHighlight,
	onFeatureUnHighlight,
	isSelected,
	isHighlighted,
	updateScroll,
}) {
	const onClick = useCallback(
		() => onFeatureSelection(featureId),
		[featureId, onFeatureSelection],
	);
	const onMouseEnter = useCallback(
		() => (isSelected ? undefined : onFeatureHighlight(featureId)),
		[isSelected, onFeatureHighlight, featureId],
	);

	useEffect(() => {
		if (isSelected) {
			updateScroll();
		}
	}, [isSelected, updateScroll]);

	return (
		<button
			tabIndex={-1}
			type="button"
			className={
				"ms3-list-cycling-box__dot " +
				(isSelected ? " ms3-list-cycling-box__dot--selected" : "") +
				(isHighlighted ? " ms3-list-cycling-box__dot--highlight" : "")
			}
			onClick={onClick}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onFeatureUnHighlight}
		/>
	);
}

export default FeatureListCyclingDot;
