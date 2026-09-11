import type {PlacePageMeta} from "./build-place-page-meta";

export const PLACE_JSON_LD_SCRIPT_ID = "mapsight-place-jsonld";

export type DocumentHeadDefaults = {
	/** Full `<title>` to restore when there is no feature/module meta. */
	title: string;
	/** Site name (`og:site_name`), appended as ` | {siteName}`. */
	siteName?: string;
	canonicalUrl?: string;
	ogImage?: string;
	/** Article `og:description` to restore when place meta is cleared. */
	description?: string;
};

export function documentTitleForMeta(
	metaTitle: string | null,
	defaults: DocumentHeadDefaults,
): string {
	if (metaTitle) {
		const site = defaults.siteName?.trim() ?? "";
		if (site !== "" && !metaTitle.includes(site)) {
			return `${metaTitle} | ${site}`;
		}
		return metaTitle;
	}
	return defaults.title;
}

/**
 * Keep the live document head in sync with Place / module pageMeta after
 * client route changes. Crawlers still read the SSR snapshot.
 */
export function applyPlacePageMetaToDocument(
	meta: PlacePageMeta | null,
	defaults: DocumentHeadDefaults,
): void {
	if (typeof document === "undefined") {
		return;
	}

	if (meta) {
		document.title = documentTitleForMeta(meta.title, defaults);
		setCanonical(meta.canonicalUrl);
		setMetaProperty("og:title", meta.og.title);
		setMetaProperty("og:description", meta.og.description);
		setMetaProperty("og:url", meta.og.url);
		setMetaProperty("og:type", meta.og.type);
		setMetaProperty("og:image", meta.og.image);
		setJsonLd(meta.jsonLd);
		return;
	}

	document.title = defaults.title;
	if (defaults.canonicalUrl) {
		setCanonical(defaults.canonicalUrl);
		setMetaProperty("og:url", defaults.canonicalUrl);
	}
	const headline = headlineFromDocumentTitle(defaults.title);
	if (headline) {
		setMetaProperty("og:title", headline);
	}
	setMetaProperty("og:type", "website");
	if (defaults.ogImage) {
		setMetaProperty("og:image", defaults.ogImage);
	}
	if (defaults.description) {
		setMetaProperty("og:description", defaults.description);
	} else {
		document.querySelector('meta[property="og:description"]')?.remove();
	}
	removeJsonLd();
}

function headlineFromDocumentTitle(title: string): string {
	const trimmed = title.trim();
	if (trimmed === "") {
		return "";
	}
	const separator = " | ";
	const index = trimmed.indexOf(separator);
	return index === -1 ? trimmed : trimmed.slice(0, index);
}

function setCanonical(href: string): void {
	let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
	if (!link) {
		link = document.createElement("link");
		link.rel = "canonical";
		document.head.appendChild(link);
	}
	link.href = href;
}

function setMetaProperty(property: string, content: string): void {
	let meta = document.querySelector<HTMLMetaElement>(
		`meta[property="${property}"]`,
	);
	if (!meta) {
		meta = document.createElement("meta");
		meta.setAttribute("property", property);
		document.head.appendChild(meta);
	}
	meta.content = content;
}

function setJsonLd(jsonLd: Record<string, unknown>): void {
	let script = document.getElementById(PLACE_JSON_LD_SCRIPT_ID);
	if (!(script instanceof HTMLScriptElement)) {
		const created = document.createElement("script");
		created.id = PLACE_JSON_LD_SCRIPT_ID;
		created.type = "application/ld+json";
		document.head.appendChild(created);
		script = created;
	}
	script.textContent = JSON.stringify(jsonLd);
}

function removeJsonLd(): void {
	document.getElementById(PLACE_JSON_LD_SCRIPT_ID)?.remove();
}
