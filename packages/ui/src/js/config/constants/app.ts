export type View =
	| typeof VIEW_DESKTOP
	| typeof VIEW_MOBILE
	| typeof VIEW_FULLSCREEN
	| typeof VIEW_MAP_ONLY;

export const VIEW_DESKTOP = "desktop";
export const VIEW_MOBILE = "mobile";

export const VIEW_FULLSCREEN = "fullscreen";
export const VIEW_MAP_ONLY = "mapOnly";

export const DETAILS_CONTENT_STATE_KEY = "featureItemDetailsContent";

export const ZOOM_IN = "zoomIn";
export const ZOOM_OUT = "zoomOut";
