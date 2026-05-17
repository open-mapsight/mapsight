import {useCallback} from "react";

function FeatureSelectButton({
	featureId,
	onSelect = null,
	onDeselect = null,
	permanentLink = undefined,
	isSelected = false,
	selectOnClick = true,
	deselectOnClick = true,
	...attributes
}) {
	const handleClick = useCallback(
		(e) => {
			if (permanentLink) {
				if (e.which === 2 || e.metaKey) {
					// Continue as normal for external links and cmd clicks etc
					return;
				}
				e.preventDefault();
			}

			if (isSelected && deselectOnClick) {
				if (onDeselect) {
					onDeselect(featureId);
				}
			} else if (selectOnClick && onSelect) {
				onSelect(featureId, {keyboard: false});
			}
		},
		[
			permanentLink,
			isSelected,
			deselectOnClick,
			selectOnClick,
			onDeselect,
			featureId,
			onSelect,
		],
	);

	const handleKeyDown = useCallback(
		(e) => {
			if (e.key === "Enter") {
				e.preventDefault();

				if (selectOnClick && onSelect) {
					onSelect(featureId, {keyboard: true});
				}
			}
		},
		[selectOnClick, onSelect, featureId],
	);

	Object.assign(attributes, {
		onClick: handleClick,
		onKeyDown: handleKeyDown,
	});

	if (permanentLink) {
		return (
			// eslint-disable-next-line jsx-a11y/anchor-has-content
			<a href={permanentLink} role="button" {...attributes} />
		);
	}

	return <button type="button" {...attributes} />;
}

export default FeatureSelectButton;
