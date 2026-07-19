import type {HTMLAttributes, KeyboardEvent, MouseEvent, ReactNode} from "react";
import {useCallback} from "react";

import {rememberDocumentScrollForSelection} from "../helpers/document-scroll";
import type {MapsightUiFeatureId} from "../types";
import type {
	ListSelectOnClick,
	SelectFeatureHandler,
} from "./feature-list-item/types";

export type FeatureSelectButtonProps = {
	featureId: MapsightUiFeatureId;
	onSelect?: SelectFeatureHandler | null;
	onDeselect?: SelectFeatureHandler | null;
	permanentLink?: string;
	isSelected?: boolean;
	selectOnClick?: ListSelectOnClick;
	deselectOnClick?: boolean;
	children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "onSelect">;

function FeatureSelectButton({
	featureId,
	onSelect = null,
	onDeselect = null,
	permanentLink = undefined,
	isSelected = false,
	selectOnClick = true,
	deselectOnClick = true,
	...attributes
}: FeatureSelectButtonProps) {
	const handlePointerDown = useCallback(() => {
		// Before focus/click scrolls the row into view (list ↔ mapOnly restore).
		rememberDocumentScrollForSelection();
	}, []);

	const handleClick = useCallback(
		(e: MouseEvent<HTMLElement>) => {
			if (permanentLink) {
				if (e.button === 1 || e.metaKey) {
					// Continue as normal for external links and cmd clicks etc
					return;
				}
				e.preventDefault();
			}

			if (isSelected && deselectOnClick) {
				onDeselect?.(featureId);
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
		(e: KeyboardEvent<HTMLElement>) => {
			if (e.key === "Enter") {
				e.preventDefault();

				if (selectOnClick && onSelect) {
					onSelect(featureId, {keyboard: true});
				}
			}
		},
		[selectOnClick, onSelect, featureId],
	);

	const interactiveAttributes = {
		...attributes,
		onPointerDown: handlePointerDown,
		onClick: handleClick,
		onKeyDown: handleKeyDown,
	};

	if (permanentLink) {
		return (
			// eslint-disable-next-line jsx-a11y/anchor-has-content
			<a href={permanentLink} role="button" {...interactiveAttributes} />
		);
	}

	return <button type="button" {...interactiveAttributes} />;
}

export default FeatureSelectButton;
