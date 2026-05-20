import {selectExclusively} from "@mapsight/core/lib/feature-selections/actions";
import {
	memo,
	useCallback,
	useEffect,
	useReducer,
	useRef,
	useState,
} from "react";
import {useDispatch, useSelector} from "react-redux";

import {VIEW_MAP_ONLY, VIEW_MOBILE} from "../../config/constants/app";
import {FEATURE_SELECTIONS} from "../../config/constants/controllers";
import {FEATURE_SELECTION_SELECT} from "../../config/feature/selections";

import getFeatureProperty from "../../helpers/get-feature-property";

import {setView} from "../../store/actions";
import {viewSelector} from "../../store/selectors";

import {
	APP_EVENT_PARTIAL_CONTENT_CHANGED,
	useAppChannelDispatchEvent,
} from "../helping/app-channel";

import FeatureDetailsContentInner from "./feature-details-content-inner";

import ShareFeatureLinkModal from "./share-feature-link-modal";

function FeatureDetailsContent({feature, html, hasError, isEmbeddedMap}) {
	const dispatch = useDispatch();
	const view = useSelector(viewSelector);

	/** @type {React.Ref<Element>} containerElemRef */
	const contentContainerElemRef = useRef();
	const [partialContentCounter, dispatchPartialContentCounter] = useReducer(
		(i) => i + 1,
		0,
	);

	const [showShareLinkDialog, setShowShareLinkDialog] = useState(false);

	/** @param {MouseEvent} e event */
	const onShareButtonClick = useCallback((e) => {
		e.preventDefault();

		if (e.target.getAttribute("href")) {
			setShowShareLinkDialog(true);
		}
	}, []);

	/** @param {MouseEvent} e event */
	const onMapButtonClick = useCallback(
		(e) => {
			e.preventDefault();

			if (view === VIEW_MOBILE && !isEmbeddedMap) {
				dispatch(setView(VIEW_MAP_ONLY));
			}

			const featureId = e.target.getAttribute("data-ms3-feature");
			if (featureId) {
				dispatch(
					selectExclusively(
						FEATURE_SELECTIONS,
						FEATURE_SELECTION_SELECT,
						featureId,
					),
				);
			}
		},
		[dispatch, isEmbeddedMap, view],
	);

	/**  @param {MouseEvent} _e event */
	const onPrintButtonClick = useCallback((_e) => {
		const doc = window.document.documentElement;
		doc.classList.add("ms3--print-feature-selection-info-only");
		window.addEventListener(
			"afterprint",
			() => {
				doc.classList.remove("ms3--print-feature-selection-info-only");
			},
			{once: true},
		);
	}, []);

	// binds click handlers to links in containerElem by querying the Dom
	// NOTE(PG): We cannot use React JSX event listeners as we need to support external HTML
	useEffect(
		function handlePartialContentChange() {
			const contentContainerElem = contentContainerElemRef.current;
			if (!contentContainerElem) {
				return undefined;
			}

			// links/buttons
			const shareLinks = contentContainerElem.querySelectorAll(
				".js-ms3-feature-link--share",
			);
			shareLinks.forEach((buttonElement) => {
				buttonElement.addEventListener("click", onShareButtonClick);
			});
			const showOnMapLinks = contentContainerElem.querySelectorAll(
				".js-ms3-feature-link--map",
			);
			showOnMapLinks.forEach((buttonElement) => {
				buttonElement.addEventListener("click", onMapButtonClick);
			});
			const printLinks = contentContainerElem.querySelectorAll(
				".js-ms3-feature-link--print",
			);
			printLinks.forEach((buttonElement) => {
				buttonElement.addEventListener("click", onPrintButtonClick);
			});

			return () => {
				shareLinks.forEach((buttonElement) => {
					buttonElement.removeEventListener(
						"click",
						onShareButtonClick,
					);
				});
				showOnMapLinks.forEach((buttonElement) => {
					buttonElement.removeEventListener(
						"click",
						onMapButtonClick,
					);
				});
				printLinks.forEach((buttonElement) => {
					buttonElement.removeEventListener(
						"click",
						onPrintButtonClick,
					);
				});
			};
		},
		[
			partialContentCounter,
			onShareButtonClick,
			onMapButtonClick,
			onPrintButtonClick,
		],
	);

	const dispatchAppChannelEvent = useAppChannelDispatchEvent();

	/**
	 * @param {Element} nextContentContainerElem container
	 */
	const handleContentChange = useCallback(
		(nextContentContainerElem) => {
			dispatchAppChannelEvent(
				new CustomEvent(APP_EVENT_PARTIAL_CONTENT_CHANGED),
			);
			contentContainerElemRef.current = nextContentContainerElem;
			dispatchPartialContentCounter({});
		},
		[dispatchAppChannelEvent],
	);

	const closeShareLinkDialog = useCallback(() => {
		setShowShareLinkDialog(false);
	}, [setShowShareLinkDialog]);

	return (
		<div>
			<FeatureDetailsContentInner
				feature={feature}
				url={getFeatureProperty(feature, "detailsUrl")}
				html={html}
				hasError={hasError}
				handleContentChange={handleContentChange}
			/>

			<ShareFeatureLinkModal
				feature={feature}
				isOpen={showShareLinkDialog}
				onRequestClose={closeShareLinkDialog}
			/>
		</div>
	);
}

export default memo(FeatureDetailsContent);
