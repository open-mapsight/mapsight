import {
	STATUS_ERROR,
	STATUS_LOADING,
} from "@mapsight/core/lib/feature-sources/selectors";

import {
	STATUS_ACTIVE,
	STATUS_INACTIVE,
} from "../../components/switcher/SwitcherEntry";
import {
	VIEW_DESKTOP,
	VIEW_FULLSCREEN,
	VIEW_MAP_ONLY,
	VIEW_MOBILE,
	ZOOM_IN,
	ZOOM_OUT,
} from "../../config/constants/app";

/*  eslint quote-props: 0 */

const en: Record<string, string> = {
	open: "open",
	close: "close",
	reset: "reset",
	show: "show",
	from: "from",
	nextEntry: "next entry",
	prevEntry: "previous entry",

	"ui.query-input.reset": "reset search",

	"ui.feature-details.share-link.head": "share link ...",
	"ui.feature-details.share-link.place": "link to choosen location:",
	"ui.feature-details.share-link.close": "close dialog to share a link",

	"ui.feature-details.content-inner.error": "error at loading details",
	"ui.feature-details.content-inner.gotoPage": "jump to page",
	"ui.feature-details.content-inner.loading": "loading details …",

	"ui.main-panel.list-toggle.open": "open list",
	"ui.main-panel.list-toggle.close": "close list",

	"ui.feature-list.sorting.byDistance": "sort announcements by distance:",
	"ui.feature-list.sorting.choose": "choose your location",
	"ui.feature-list.sorting.own": "use device location",
	"ui.feature-list.sorting.announcements": "sort announcements …",
	"ui.feature-list.distance.fromGeolocation": "Distance from your location",
	"ui.feature-list.tag-switcher.announcements": "filter by tags …",

	"ui.feature-list.content.noListSelected": "no list selected",
	"ui.feature-list.content.noEntries": "no entries in list",
	"ui.feature-list.loading": "Loading list…",
	"ui.feature-list.error": "Could not load list.",

	"ui.async-status.loading": "Loading…",
	"ui.async-status.error": "Could not load data.",
	"ui.async-status.retry": "Try again",
	"ui.async-status.refreshing": "Updating…",
	"ui.async-status.paused": "Waiting for network…",
	"ui.feature-details.content.title": "title",
	"ui.feature-details.content.description": "description",

	"ui.feature-list.query-input.search": "text search in list below",
	"ui.feature-list.query-input.placeholder": "search in list …",

	"ui.time-filter.span": "set preview period", // FIXME prüfen

	"ui.search.send": "search",

	"ui.search.result.error": "error at loading search results",
	"ui.search.result.empty": "no search results",

	"ui.search.query-input.label": "street or location",
	"ui.search.query-input.placeholder": "street or location ...",

	"ui.feature-selection-info.close": "close information dialog",

	"ui.map-overlay.search.open": "open search",
	"ui.map-overlay.search.close": "close search",
	"ui.map-overlay.search.modal.label": "Search function",
	"ui.map-overlay.search.modal.headline": "Search",

	"ui.map-overlay.logo.copyright": "The map is based on Mapsight",

	"ui.map-overlay.info.modal.label": "Citations and Information",
	"ui.map-overlay.info.modal.headline": "Citations and Information",
	"ui.map-overlay.info.closeSources":
		"Close Citations and Information dialog",
	"ui.map-overlay.info.legend": "legend",
	"ui.map-overlay.info.closeLegend": "close legend",
	"ui.map-overlay.info.open":
		"open source disclosures and further information",

	"ui.map-overlay.layer-switcher.modal.label": "Layers",
	"ui.map-overlay.layer-switcher.layers": "layers",
	"ui.map-overlay.layer-switcher.closeLayers": "close layer picker",
	"ui.map-overlay.layer-switcher.openLayers": "open layer picker",
	"ui.layer-switcher.baseLayers": "Base map",
	"ui.layer-switcher.overlayLayers": "Data layers",

	"ui.map.usage.heading": "Keyboard shortcuts for map usage",
	"ui.map.usage.html":
		'<dl class="ms3-map-usage">' +
		'<dt><kbd aria-label="Arrow right">→</kbd></dt><dd>move right</dd>' +
		'<dt><kbd aria-label="Arrow left">←</kbd></dt><dd>move left</dd>' +
		'<dt><kbd aria-label="Arrow down">↓</kbd></dt><dd>move down</dd>' +
		'<dt><kbd aria-label="Arrow up">↑</kbd></dt><dd>move up</dd>' +
		"<dt><kbd>+</kbd></dt><dd>zoom in</dd>" +
		"<dt><kbd>-</kbd></dt><dd>zoom out</dd>" +
		"</dl>",
	"ui.map.visuallyhidden": "This part of the page shows a geographical map.",

	[`ui.view-toggle-button.ariaLabel${VIEW_MAP_ONLY}`]: "show map only",
	[`ui.view-toggle-button.ariaLabel${VIEW_FULLSCREEN}`]:
		"switch to full screen",
	[`ui.view-toggle-button.ariaLabel${VIEW_DESKTOP}`]: "close full screen",
	[`ui.view-toggle-button.ariaLabel${VIEW_MOBILE}`]: "switch to list",

	[`ui.view-toggle-button.label${VIEW_MAP_ONLY}`]: "map",
	[`ui.view-toggle-button.label${VIEW_FULLSCREEN}`]: "full screen",
	[`ui.view-toggle-button.label${VIEW_DESKTOP}`]: "full screen",
	[`ui.view-toggle-button.label${VIEW_MOBILE}`]: "list",

	[`ui.zoom-button.ariaLabel${ZOOM_OUT}`]: "zoom in",
	[`ui.zoom-button.ariaLabel${ZOOM_IN}`]: "zoom out",

	[`ui.zoom-button.label${ZOOM_OUT}`]: "zoom in",
	[`ui.zoom-button.label${ZOOM_IN}`]: "zoom out",

	[`ui.switcher.entry.label${STATUS_ERROR}`]: "error at loading",
	[`ui.switcher.entry.label${STATUS_LOADING}`]: "loading",
	[`ui.switcher.entry.label${STATUS_ACTIVE}`]: "active",
	[`ui.switcher.entry.label${STATUS_INACTIVE}`]: "inactive",

	"ui.user-geo-location-button.label": "jump to your location",
	"ui.user-geo-location-button.ariaLabel": "jump to your location",

	"ui.pagination.nextPage": ">",
	"ui.pagination.prevPage": "<",
	"ui.pagination.nextPageLabel": "Go to next page",
	"ui.pagination.prevPageLabel": "Go to previous page",
	"ui.pagination.goToSelectedPageLabel": "You are on page {page}",
	"ui.pagination.goToPageLabel": "Go to page {page}",

	"ui.share-position-link.title": "Share position",
	"ui.share-position-link.instructions":
		"Click on the map to share a position.",
	"ui.share-position-link.shareTitle": "Share marked position",
	"ui.share-position-link.shareButtonLabel": "Share marked position",
};

export default en;
