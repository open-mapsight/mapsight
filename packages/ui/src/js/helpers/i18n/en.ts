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
	// BottomSheet accessibility defaults.
	"ui.bottom-sheet.resize": "Resize",
	"ui.bottom-sheet.snap-value": "Position {position} of {count}",
	// UE: search status and previously missing shared labels.
	shareLink: "Share link",
	marker: "Marker",
	"ui.search.result.loading": "Searching…",
	"ui.search.result.count": "{count} results",
	"ui.search.result.none": "No results",
	"ui.search.result.selected": "{name} selected",

	open: "open",
	close: "close",
	reset: "reset",
	show: "show",
	from: "from",
	nextEntry: "next entry",
	prevEntry: "previous entry",

	"ui.query-input.reset": "reset search",

	"ui.feature-details.share-link.head": "share link ...",
	"ui.feature-details.share-link.place": "link to chosen location:",
	"ui.feature-details.share-link.close": "close dialog to share a link",

	"ui.place-actions.nav": "Place actions",
	"ui.place-actions.share": "Share",
	"ui.place-actions.share.tooltip": "Share this place",
	"ui.place-actions.share.dialog": "Share link",
	"ui.place-actions.share.copy": "Copy link",
	"ui.place-actions.share.copied": "Copied",
	"ui.place-actions.share.close": "Close share dialog",
	"ui.place-actions.share.copy-success": "Link copied",
	"ui.place-actions.navigate": "Directions",
	"ui.place-actions.navigate.tooltip":
		"Navigate to this place with another app",
	"ui.place-actions.navigate.menu": "Choose navigation",
	"ui.place-actions.navigate.geo": "Device maps app",
	"ui.place-actions.navigate.google": "Google Maps",
	"ui.place-actions.navigate.apple": "Apple Maps",
	"ui.place-actions.show-on-map": "Show on map",
	"ui.place-actions.show-on-map.tooltip": "Show this place on the map",
	"ui.place-actions.copy-coords": "Copy coordinates",
	"ui.place-actions.copy-coords.tooltip": "Copy these coordinates",
	"ui.place-actions.copy-coords.copied": "Copied",
	"ui.place-actions.copy-coords.copy-success": "Coordinates copied",
	"ui.place-actions.website": "Website",
	"ui.place-actions.website.tooltip": "Open this place’s website",
	"ui.place-actions.call": "Call",
	"ui.place-actions.call.tooltip": "Call this place",
	"ui.place-actions.copy-failed":
		"Copy failed. Please copy the text manually.",

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

	"ui.feature-list.options.trigger": "Filter and sort list",
	"ui.feature-list.options.title": "Filter and sort list",
	"ui.feature-list.options.close": "Close list options",
	"ui.feature-list.options.sorting": "Sorting",
	"ui.feature-list.options.location": "Location",
	"ui.feature-list.options.filter": "Filter",
	"ui.feature-list.options.reset": "Reset",
	"ui.feature-list.options.entries": "entries",
	"ui.feature-list.options.filterActive": "Filter active",

	"ui.feature-list.content.noListSelected": "no list selected",
	"ui.feature-list.content.noEntries": "no entries in list",
	"ui.feature-list.loading": "Loading list…",
	"ui.feature-list.error": "Could not load list.",

	"ui.async-status.loading": "Loading…",
	"ui.async-status.error": "Could not load data.",
	"ui.async-status.retry": "Try again",
	"ui.async-status.refreshing": "Updating…",
	"ui.async-status.paused": "Waiting for network…",

	"ui.error-boundary.page": "The application could not be displayed.",
	"ui.error-boundary.region": "This section could not be displayed.",
	"ui.error-boundary.overlay": "This control failed.",
	"ui.error-boundary.retry": "Try again",
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

	"ui.map-overlay.logo.copyright": "Built with Mapsight",

	"ui.region-selector.label": "Center map on a region",

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
	"ui.layer-switcher.expandGroup": "Expand group",
	"ui.layer-switcher.collapseGroup": "Collapse group",
	"ui.layer-switcher.cannotDeselectBaseLayer":
		"A base map must remain selected.",

	"ui.map.usage.heading": "Keyboard shortcuts for map usage",
	"ui.map.usage.html":
		'<dl class="ms3-map-usage">' +
		'<dt><kbd><span aria-hidden="true">→</span><span class="ms3-visuallyhidden">Arrow right</span></kbd></dt><dd>move right</dd>' +
		'<dt><kbd><span aria-hidden="true">←</span><span class="ms3-visuallyhidden">Arrow left</span></kbd></dt><dd>move left</dd>' +
		'<dt><kbd><span aria-hidden="true">↓</span><span class="ms3-visuallyhidden">Arrow down</span></kbd></dt><dd>move down</dd>' +
		'<dt><kbd><span aria-hidden="true">↑</span><span class="ms3-visuallyhidden">Arrow up</span></kbd></dt><dd>move up</dd>' +
		"<dt><kbd>+</kbd></dt><dd>zoom in</dd>" +
		"<dt><kbd>-</kbd></dt><dd>zoom out</dd>" +
		"<dt><kbd>Shift+F10</kbd></dt><dd>Open the menu at the map centre</dd>" +
		"</dl>",
	"ui.map.visuallyhidden": "This part of the page shows a geographical map.",
	"ui.point-input.instructions":
		"On the focused map, arrow keys pan and + and − zoom. The crosshair marks the map centre. Press Enter or Space, or the “Use map centre” button, to set the point there. Confirming again replaces it.",
	"ui.point-input.confirm": "Use map centre",
	"ui.point-input.help": "Keyboard help",
	"ui.point-input.close-help": "Close keyboard help",
	"ui.point-input.position": "Map centre (latitude, longitude):",
	"ui.point-input.confirmed": "Position confirmed (latitude, longitude):",
	"ui.map.label": "Interactive map",
	"ui.map.roledescription": "Map",

	"ui.wrapper.overlay.fullscreen": "Fullscreen map",
	"ui.wrapper.overlay.mapOnly": "Map",
	"ui.wrapper.overlay.escape": "Press Escape to exit",

	[`ui.view-toggle-button.ariaLabel${VIEW_MAP_ONLY}`]: "show map only",
	[`ui.view-toggle-button.ariaLabel${VIEW_FULLSCREEN}`]:
		"switch to full screen",
	[`ui.view-toggle-button.ariaLabel${VIEW_DESKTOP}`]: "close full screen",
	[`ui.view-toggle-button.ariaLabel${VIEW_MOBILE}`]: "switch to list",

	[`ui.view-toggle-button.label${VIEW_MAP_ONLY}`]: "map",
	[`ui.view-toggle-button.label${VIEW_FULLSCREEN}`]: "full screen",
	[`ui.view-toggle-button.label${VIEW_DESKTOP}`]: "full screen",
	[`ui.view-toggle-button.label${VIEW_MOBILE}`]: "list",

	[`ui.zoom-button.ariaLabel${ZOOM_OUT}`]: "zoom out",
	[`ui.zoom-button.ariaLabel${ZOOM_IN}`]: "zoom in",

	[`ui.zoom-button.label${ZOOM_OUT}`]: "zoom out",
	[`ui.zoom-button.label${ZOOM_IN}`]: "zoom in",

	[`ui.switcher.entry.label${STATUS_ERROR}`]: "error at loading",
	[`ui.switcher.entry.label${STATUS_LOADING}`]: "loading",
	[`ui.switcher.entry.label${STATUS_ACTIVE}`]: "active",
	[`ui.switcher.entry.label${STATUS_INACTIVE}`]: "inactive",

	"ui.user-geo-location-button.label": "jump to your location",
	"ui.user-geo-location-button.ariaLabel": "jump to your location",
	"ui.user-geo-location-button.requesting": "Requesting your location …",
	"ui.user-geo-location-button.error":
		"Your location could not be determined.",

	// List chrome accessibility.
	"ui.pagination.label": "Page navigation",
	"ui.pagination.jumpForward": "Jump forward",
	"ui.pagination.jumpBackward": "Jump backward",
	"ui.pagination.status": "Page {n} of {total}",
	"ui.feature-list.filter.status": "{n} of {total} entries",
	"ui.feature-list.filter.empty": "No entries",
	"ui.feature-list.cycling.status": "Station {n} of {total}: {name}",

	"ui.pagination.nextPage": ">",
	"ui.pagination.prevPage": "<",
	"ui.pagination.nextPageLabel": "Go to next page",
	"ui.pagination.prevPageLabel": "Go to previous page",
	"ui.pagination.goToSelectedPageLabel": "You are on page {page}",
	"ui.pagination.goToPageLabel": "Go to page {page}",

	"ui.map-point.menu": "Map point",
	"ui.map-point.mark": "Mark this point",
	"ui.map-point.copy-coords": "Copy coordinates",
	"ui.map-point.directions": "Directions",
	"ui.map-point.from-here": "From here…",
	"ui.map-point.to-here": "To here…",
	"ui.map-point.marked": "Pin dropped",
	"ui.map-point.geocoded": "Nearest address: {name}",
	"ui.map-point.copied": "Coordinates copied",

	"ui.share-position-link.title": "Share position",
	"ui.share-position-link.shareTitle": "Place on the map",
	"ui.share-position-link.shareButtonLabel": "Share link",
	"ui.share-position-link.instructions":
		"Share the map centre or click the map to choose a place.",
	"ui.share-position-link.instructions-marked":
		"Click the map again to change the place.",
	"ui.share-position-link.link-center": "Link to the map centre",
	"ui.share-position-link.link-marked": "Link to the marked place",
	"ui.share-position-link.remove-marker": "Remove marker",
	"ui.share-position-link.keyboard.select":
		"Mark the place at the map centre",
	"ui.share-position-link.keyboard.remove": "Remove the marker",

	"ui.tool-overlay.keyboard-help": "Keyboard controls",
	"ui.tool-overlay.keyboard-help.focus": "With the map focused:",
	"ui.tool-overlay.to-map": "Skip to the map",
	"ui.tool-overlay.back-to-tool": "Back to “{name}”",
	"ui.tool-overlay.keyboard.pan": "Pan the map",
	"ui.keys.space": "Space",
	"ui.keys.enter": "Enter",
	"ui.keys.backspace": "Backspace",
	"ui.keys.arrows": "Arrow keys",

	"ui.link-share.input": "Link to share",

	"ui.measure-distance.finish": "Done",
	"ui.measure-distance.keyboard.add": "Add a point at the map centre",
	"ui.measure-distance.keyboard.finish": "Finish the line (from two points)",
	"ui.measure-distance.keyboard.remove": "Remove the last point",
};

export default en;
