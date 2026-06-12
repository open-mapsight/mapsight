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

const de: Record<string, string> = {
	open: "öffnen",
	close: "schließen",
	reset: "zurücksetzen",
	show: "anzeigen",
	from: "von",
	nextEntry: "Vorheriger Eintrag",
	prevEntry: "Nächster Eintrag",

	"ui.query-input.reset": "Suche zurücksetzen",

	"ui.feature-details.share-link.head": "Link teilen...",
	"ui.feature-details.share-link.place": "Link zum ausgewählten Ort:",
	"ui.feature-details.share-link.close": "Link-teilen-Dialog schließen",

	"ui.feature-details.content-inner.error": "Fehler beim Laden der Details.",
	"ui.feature-details.content-inner.gotoPage": "Direkt zur Seite springen",
	"ui.feature-details.content-inner.loading": "Lade Details …",

	"ui.main-panel.list-toggle.open": "Liste öffnen",
	"ui.main-panel.list-toggle.close": "Liste schließen",

	"ui.feature-list.sorting.byDistance":
		"Meldungen nach Entfernung sortieren:",
	"ui.feature-list.sorting.choose": "Standort wählen ...",
	"ui.feature-list.sorting.own": "eigenen Standort verwenden",
	"ui.feature-list.sorting.announcements": "Meldungen sortieren …",
	"ui.feature-list.tag-switcher.announcements": "Nach Tags filtern …",

	"ui.feature-list.content.noListSelected": "keine Liste gewählt",
	"ui.feature-list.content.noEntries": "keine Einträge",
	"ui.feature-details.content.title": "Bezeichnung",
	"ui.feature-details.content.description": "Bemerkung",

	"ui.feature-list.query-input.search": "Textsuche in Liste darunter",
	"ui.feature-list.query-input.placeholder": "In Liste suchen …",

	"ui.time-filter.span": "Vorschauzeitraum festlegen",

	"ui.search.send": "Suchen",

	"ui.search.result.error": "Fehler beim Laden der Suchergebnisse",
	"ui.search.result.empty": "Keine Ergebnisse gefunden",

	"ui.search.query-input.label": "Straße oder Ort",
	"ui.search.query-input.placeholder": "Straße oder Ort ...",

	"ui.feature-selection-info.close": "Informationsdialog schließen",

	"ui.map-overlay.search.open": "Suche öffnen",
	"ui.map-overlay.search.close": "Suche schließen",
	"ui.map-overlay.search.modal.label": "Suchfunktion",
	"ui.map-overlay.search.modal.headline": "Suche",

	"ui.map-overlay.logo.copyright": "Diese Kartenanwendung nutzt Mapsight",

	"ui.map-overlay.info.modal.label": "Quellenangaben und Informationen",
	"ui.map-overlay.info.modal.headline": "Quellenangaben und Informationen",
	"ui.map-overlay.info.closeSources":
		"Quellenangaben und Informationen schließen",
	"ui.map-overlay.info.legend": "Legende",
	"ui.map-overlay.info.closeLegend": "Legende schließen",
	"ui.map-overlay.info.open":
		"Quellenangaben und weitere Informationen öffnen",

	"ui.map-overlay.layer-switcher.modal.label": "Ebenenauswahl",
	"ui.map-overlay.layer-switcher.layers": "Ebenen",
	"ui.map-overlay.layer-switcher.closeLayers": "Ebenenauswahl schließen",
	"ui.map-overlay.layer-switcher.openLayers": "Ebenenauswahl öffnen",

	// HOWTO: wrap the metadata one base layer of the project with something like
	// 		withLegend(_metadata, `<article><h1>${translate('ui.map.usage.heading')}</h1>${translate('ui.map.usage.html')}</article>`)
	// change 'ui.map-overlay.info.legend' according to the use case, ie. set it to "Tastaturbedienung" if there are no other legends, or to "Legende und Tastaturbedienung" if there are such further legends
	// additinally adapt 'ui.map-overlay.info.open'
	"ui.map.usage.heading": "Tastaturbedienung der Karte",
	"ui.map.usage.html":
		'<dl class="ms3-map-usage">' +
		'<dt><kbd aria-label="Cursor rechts">→</kbd></dt><dd>nach rechts verschieben</dd>' +
		'<dt><kbd aria-label="Cursor links">←</kbd></dt><dd>nach links verschieben</dd>' +
		'<dt><kbd aria-label="Cursor runter">↓</kbd></dt><dd>nach unten verschieben</dd>' +
		'<dt><kbd aria-label="Cursor hoch">↑</kbd></dt><dd>nach oben verschieben</dd>' +
		"<dt><kbd>+</kbd></dt><dd>hineinzoomen</dd>" +
		"<dt><kbd>-</kbd></dt><dd>herauszoomen</dd>" +
		"</dl>",
	"ui.map.visuallyhidden":
		"Dieser Bereich der Webseite zeigt eine Landkarte.",

	[`ui.view-toggle-button.ariaLabel${VIEW_MAP_ONLY}`]: "Zur Karte wechseln",
	[`ui.view-toggle-button.ariaLabel${VIEW_FULLSCREEN}`]:
		"Zum Vollbild wechseln",
	[`ui.view-toggle-button.ariaLabel${VIEW_DESKTOP}`]: "Vollbild schließen",
	[`ui.view-toggle-button.ariaLabel${VIEW_MOBILE}`]: "Zur Liste wechseln",

	[`ui.view-toggle-button.label${VIEW_MAP_ONLY}`]: "Karte",
	[`ui.view-toggle-button.label${VIEW_FULLSCREEN}`]: "Vollbild",
	[`ui.view-toggle-button.label${VIEW_DESKTOP}`]: "Vollbild",
	[`ui.view-toggle-button.label${VIEW_MOBILE}`]: "Liste",

	[`ui.zoom-button.ariaLabel${ZOOM_OUT}`]: "Karte verkleinern",
	[`ui.zoom-button.ariaLabel${ZOOM_IN}`]: "Karte vergrößern",
	[`ui.zoom-button.label${ZOOM_OUT}`]: "Verkleinern",
	[`ui.zoom-button.label${ZOOM_IN}`]: "Vergrößern",

	[`ui.switcher.entry.label${STATUS_ERROR}`]: "Fehler beim Laden",
	[`ui.switcher.entry.label${STATUS_LOADING}`]: "Lädt",
	[`ui.switcher.entry.label${STATUS_ACTIVE}`]: "Aktiv",
	[`ui.switcher.entry.label${STATUS_INACTIVE}`]: "Inaktiv",

	"ui.user-geo-location-button.label": "Zum eigenen Standort springen",
	"ui.user-geo-location-button.ariaLabel": "Zum eigenen Standort springen",

	"ui.pagination.nextPage": ">",
	"ui.pagination.prevPage": "<",
	"ui.pagination.nextPageLabel": "Zur nächsten Seite blättern",
	"ui.pagination.prevPageLabel": "Zur vorherigen Seite blättern",
	"ui.pagination.goToSelectedPageLabel": "Sie sind aktuell auf Seite {page}",
	"ui.pagination.goToPageLabel": "Zur Seite {page} blättern",

	"ui.share-position-link.title": "Ort teilen",
	"ui.share-position-link.instructions":
		"Klicken Sie auf die Karte um einen Ort zu teilen.",
	"ui.share-position-link.shareTitle": "Markierten Ort teilen",
	"ui.share-position-link.shareButtonLabel": "Markierten Ort teilen",
};

export default de;
