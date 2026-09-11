import type {CSSProperties, ReactElement} from "react";

/** Bump when the card layout changes so sidecar file-cache keys invalidate. */
export const PLACE_OG_CARD_VERSION = 1;

export const PLACE_OG_CARD_WIDTH = 1200;
export const PLACE_OG_CARD_HEIGHT = 630;

const DEFAULT_WORDMARK = "Map";

export type PlaceOgCardProps = {
	title: string;
	/** Generic default; hosts may pass their own label. */
	wordmark?: string;
};

const rootStyle: CSSProperties = {
	width: PLACE_OG_CARD_WIDTH,
	height: PLACE_OG_CARD_HEIGHT,
	display: "flex",
	flexDirection: "column",
	justifyContent: "space-between",
	padding: "72px 80px",
	backgroundColor: "#142033",
	color: "#f4f7fb",
	fontFamily: "Inter",
};

const wordmarkStyle: CSSProperties = {
	display: "flex",
	fontSize: 28,
	letterSpacing: 4,
	textTransform: "uppercase",
	opacity: 0.72,
};

const titleStyle: CSSProperties = {
	display: "flex",
	fontSize: 72,
	lineHeight: 1.15,
	fontWeight: 700,
};

/**
 * Satori-friendly Open Graph card. Inline flex styles only — no CSS
 * modules, no satori/resvg imports.
 */
export default function PlaceOgCard({
	title,
	wordmark = DEFAULT_WORDMARK,
}: PlaceOgCardProps): ReactElement {
	return (
		<div style={rootStyle}>
			<div style={wordmarkStyle}>{wordmark}</div>
			<div style={titleStyle}>{title}</div>
		</div>
	);
}
