import type {ReactNode} from "react";
import {
	memo,
	useCallback,
	useEffect,
	useReducer,
	useRef,
	useState,
} from "react";
import {useDispatch, useSelector} from "react-redux";

import {selectExclusively} from "@mapsight/core/lib/feature-selections/actions";

import {VIEW_MAP_ONLY, VIEW_MOBILE} from "../../config/constants/app";
import {FEATURE_SELECTIONS} from "../../config/constants/controllers";
import {FEATURE_SELECTION_SELECT} from "../../config/feature/selections";
import getFeatureProperty from "../../helpers/get-feature-property";
import {setView} from "../../store/actions";
import {viewSelector} from "../../store/selectors";
import type {MapsightUiFeature} from "../../types";
import ErrorBoundary from "../error-boundary";
import {
	APP_EVENT_PARTIAL_CONTENT_CHANGED,
	useAppChannelDispatchEvent,
} from "../helping/app-channel";
import FeatureDetailsContentInner from "./feature-details-content-inner";
import ShareFeatureLinkModal from "./share-feature-link-modal";

export type FeatureDetailsContentProps = {
	feature: MapsightUiFeature;
	html?: string;
	hasError: boolean;
	isEmbeddedMap?: boolean;
	actions?: ReactNode;
};

function FeatureDetailsContent({
	feature,
	html,
	hasError,
	isEmbeddedMap,
	actions = undefined,
}: FeatureDetailsContentProps) {
	const dispatch = useDispatch();
	const view = useSelector(viewSelector);

	const contentContainerElemRef = useRef<HTMLElement | null>(null);
	const [partialContentCounter, dispatchPartialContentCounter] = useReducer(
		(i) => i + 1,
		0,
	);

	const [showShareLinkDialog, setShowShareLinkDialog] = useState(false);

	const onShareButtonClick = useCallback((e: MouseEvent) => {
		e.preventDefault();

		if ((e.target as Element).getAttribute("href")) {
			setShowShareLinkDialog(true);
		}
	}, []);

	const onMapButtonClick = useCallback(
		(e: MouseEvent) => {
			e.preventDefault();

			if (view === VIEW_MOBILE && !isEmbeddedMap) {
				dispatch(setView(VIEW_MAP_ONLY));
			}

			const featureId = (e.target as Element).getAttribute(
				"data-ms3-feature",
			);
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

	const onPrintButtonClick = useCallback((_e: MouseEvent) => {
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
			const shareLinks =
				contentContainerElem.querySelectorAll<HTMLElement>(
					".js-ms3-feature-link--share",
				);
			shareLinks.forEach((buttonElement) => {
				buttonElement.addEventListener("click", onShareButtonClick);
			});
			const showOnMapLinks =
				contentContainerElem.querySelectorAll<HTMLElement>(
					".js-ms3-feature-link--map",
				);
			showOnMapLinks.forEach((buttonElement) => {
				buttonElement.addEventListener("click", onMapButtonClick);
			});
			const printLinks =
				contentContainerElem.querySelectorAll<HTMLElement>(
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

	const handleContentChange = useCallback(
		(nextContentContainerElem: HTMLElement | null) => {
			dispatchAppChannelEvent(
				new CustomEvent(APP_EVENT_PARTIAL_CONTENT_CHANGED),
			);
			contentContainerElemRef.current = nextContentContainerElem;
			dispatchPartialContentCounter();
		},
		[dispatchAppChannelEvent],
	);

	const closeShareLinkDialog = useCallback(() => {
		setShowShareLinkDialog(false);
	}, [setShowShareLinkDialog]);

	return (
		<ErrorBoundary resetKeys={[feature?.id]} variant="region">
			<div>
				<FeatureDetailsContentInner
					feature={feature}
					url={
						getFeatureProperty(feature, "detailsUrl") as
							string | undefined
					}
					html={html}
					hasError={hasError}
					handleContentChange={handleContentChange}
					actions={actions}
				/>

				<ShareFeatureLinkModal
					feature={feature}
					isOpen={showShareLinkDialog}
					onRequestClose={closeShareLinkDialog}
				/>
			</div>
		</ErrorBoundary>
	);
}

export default memo(FeatureDetailsContent);
