// ausgewähltes Feature für Detail-Ansicht
export const FEATURE_SELECTION_SELECT = "select";
// in Liste vorgewähltes Feature, ohne Detailansicht
export const FEATURE_SELECTION_PRESELECT = "preselect";
// in Liste und Karte hervorheben bei Mouse-Hover
export const FEATURE_SELECTION_HIGHLIGHT = "highlight";

// Attention! With respect to the map icon state this is an ordered collection. The map vector style will only correspond to that set state with the highest priority, ie. the one which has been mentioned first.
export default {
	[FEATURE_SELECTION_SELECT]: {max: 1},
	[FEATURE_SELECTION_HIGHLIGHT]: {max: 1},
	[FEATURE_SELECTION_PRESELECT]: {max: 1},
};
