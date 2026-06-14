import ReactModal from "react-modal";

/**
 * Configure react-modal for Mapsight host apps without exposing react-modal directly
 * in every starter entry point.
 */
export function configureReactModalAppElement(element: HTMLElement | string) {
	ReactModal.setAppElement(element);
}
