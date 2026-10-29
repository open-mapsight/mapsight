import type {ElementType, MouseEvent} from "react";
import {memo} from "react";
import ReactModal from "react-modal";

import {Heading, useHeadingElement} from "../../headings";
import getFeatureProperty from "../../helpers/get-feature-property";
import {translate} from "../../helpers/i18n";
import type {MapsightUiFeature} from "../../types";

const selectInputContent = (e: MouseEvent<HTMLInputElement>) =>
	e.currentTarget.setSelectionRange(0, e.currentTarget.value.length);

/* NOTE: we use a wrapping label around the input element which is fine a11y as well. */
function ShareFeatureLinkModal({
	isOpen,
	onRequestClose,
	feature,
	headlineAs,
}: {
	isOpen: boolean;
	onRequestClose?: ReactModal.Props["onRequestClose"];
	feature: MapsightUiFeature;
	headlineAs?: ElementType;
}) {
	const Headline = useHeadingElement("dialogTitle", headlineAs, {
		level: 2,
	});
	return (
		<ReactModal
			isOpen={isOpen}
			// contentLabel="onRequestClose Example" // aria-label="" on .ms3-modal
			onRequestClose={onRequestClose}
			className="ms3-modal"
			overlayClassName="ms3-app-overlay"
			shouldCloseOnOverlayClick={true}
		>
			<div className="ms3-modal__inner">
				<div className="ms3-share-link">
					<Heading as={Headline} className="ms3-share-link__head">
						{translate("ui.feature-details.share-link.head")}
					</Heading>

					<label className="ms3-share-link__label">
						{translate("ui.feature-details.share-link.place")}
						<br />

						<input
							className="ms3-share-link__input"
							value={
								getFeatureProperty(feature, "permanentLink") as
									string | undefined
							}
							onClick={selectInputContent}
							readOnly={true}
						/>
					</label>
				</div>

				<button
					className="ms3-dialog-close-button"
					type="button"
					onClick={onRequestClose}
				>
					<span className="ms3-visuallyhidden">
						{translate("ui.feature-details.share-link.close")}
					</span>
				</button>
			</div>
		</ReactModal>
	);
}

export default memo(ShareFeatureLinkModal);
