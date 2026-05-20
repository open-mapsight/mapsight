import {createFeatureSelectionSelector} from "@mapsight/core/lib/feature-selections/selectors";
import {findFeatureInFeatureSourcesById} from "@mapsight/core/lib/feature-sources/selectors";
import type {FeatureSourcesState} from "@mapsight/core/lib/feature-sources/types";
import type {State} from "@mapsight/core/types";

import {getAndObserveState} from "@mapsight/lib-redux/observe-state";

import * as c from "../../config/constants/controllers";
import {FEATURE_SELECTION_SELECT} from "../../config/feature/selections";
import getFeatureProperty from "../../helpers/get-feature-property";
import {setFeatureDetailsUrl} from "../../store/actions";
import type {
	MapsightUiFeature,
	MapsightUiFeatureProperty,
	PluginInstance,
} from "../../types";

const defaultFeatureSelectionsController = c.FEATURE_SELECTIONS;
const defaultFeatureSourcesController = c.FEATURE_SOURCES;
const defaultFeatureSelection = FEATURE_SELECTION_SELECT;
const defaultFeaturePropertyDetailsUrl: MapsightUiFeatureProperty =
	"detailsUrl";

/**
 * This plugin will load the dispatch the details url on feature selection.
 *
 * @param {object} [options] options
 * @param {string} [options.featureSelectionsController] name of the feature selections controller, defaults to mapsight ui default
 * @param {string} [options.featureSelection="select"] name of the feature selection to track
 * @param {string} [options.featureSourcesController] name of the feature sources controller, defaults to mapsight ui default
 * @param {string} [options.featurePropertyDetailsUrl="detailsUrl"] feature property to get the details url from
 * @returns {import('../../types').PluginInstance} plugin instance
 */
export default function createPlugin(
	options: {
		featureSelectionsController?: string;
		featureSelection?: string;
		featureSourcesController?: string;
		featurePropertyDetailsUrl?: MapsightUiFeatureProperty;
	} = {},
): PluginInstance {
	const {
		featureSelectionsController = defaultFeatureSelectionsController,
		featureSelection = defaultFeatureSelection,
		featureSourcesController = defaultFeatureSourcesController,
		featurePropertyDetailsUrl = defaultFeaturePropertyDetailsUrl,
	} = options;
	const selectorSelectedFeatures = createFeatureSelectionSelector(
		featureSelectionsController,
		featureSelection,
	);

	return {
		beforeRender: function setupFeatureSelection(context) {
			const {store} = context;
			if (!store) return;

			let unsubscribeObserveSelectedFeature: undefined | (() => void);

			const handleFeatureSelection = () => {
				if (unsubscribeObserveSelectedFeature) {
					unsubscribeObserveSelectedFeature();
					unsubscribeObserveSelectedFeature = undefined;
				}

				const state = store.getState();
				const selection = selectorSelectedFeatures(state);
				const featureIds = selection?.features;

				if (!featureIds || !featureIds.length) {
					return;
				}

				// Anmerkung: Dieser Code ignoriert den Sonderfall, dass sich die URL eines bereits selektierten POI _nach_ dem Select und nach dem ersten Load aufgrund eines Reloads ändert
				// Der Code in fetchText sieht zudem kein Refresh der Inhalte vor. Der angezeigte Text ist also auch aus anderen Gründen potentiell veraltet.
				// In Beiden Fällen kann der User das Aktualsiseren auslösen indem er den POI deselektiert (Feature-Details schließt) und wieder selektiert.
				// → diese Sonderfälle werden zu Recht ignoriert. Wo man das automatische Aktualisieren braucht, schreibe man die Description direkt in die geojson.

				const detailsUrlSelector = (state: State) => {
					const selectedFeature = findFeatureInFeatureSourcesById(
						state[featureSourcesController] as FeatureSourcesState,
						featureIds[0]!,
					);
					if (selectedFeature) {
						return getFeatureProperty(
							selectedFeature as MapsightUiFeature,
							featurePropertyDetailsUrl,
						) as string | null;
					}

					return null;
				};
				const detailsUrl = detailsUrlSelector(state);
				if (detailsUrl) {
					// im Normalfall setzt der User das Select und da ist das Feature schon geladen.
					store.dispatch(setFeatureDetailsUrl(detailsUrl));
					return;
				}

				// wenn das feature anderweitig, zB. über einen Url-Parameter gesetzt wird, ist es noch nicht geladen
				// dann und nur dann darauf warten.
				// das betrifft aber nicht den SSR-Fall, dafür ist render-await-... zuständig.

				const updateFeatureDetailsUrl = () => {
					const updatedState = store.getState();
					const updatedSelection =
						selectorSelectedFeatures(updatedState);
					const updatedFeatureIds = updatedSelection?.features ?? [];
					const updatedDetailsUrl = detailsUrlSelector(
						store.getState(),
					);

					if (
						updatedDetailsUrl &&
						featureIds[0] === updatedFeatureIds[0] // entprellen, falls updateFeatureDetailsUrl zB. beim unsubscribe aufgerufen wird und inzwischen ein anderer poi selektiert ist
					) {
						store.dispatch(setFeatureDetailsUrl(updatedDetailsUrl));
					}
				};

				unsubscribeObserveSelectedFeature = getAndObserveState(
					store,
					detailsUrlSelector,
					updateFeatureDetailsUrl,
				);
			};

			getAndObserveState(
				store,
				selectorSelectedFeatures,
				handleFeatureSelection,
			);
		},
	};
}
