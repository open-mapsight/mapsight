export type PageMetaOg = {
	title: string;
	description: string;
	url: string;
	type: "place" | "website";
	image: string;
};

/** Title, canonical, Open Graph, and JSON-LD for any host route. */
export type PageMeta = {
	title: string;
	description: string;
	canonicalUrl: string;
	og: PageMetaOg;
	jsonLd: Record<string, unknown>;
};

export type DocumentHeadDefaults = {
	/** Full `<title>` to restore when there is no route meta. */
	title: string;
	/** Site name (`og:site_name`), appended as ` | {siteName}`. */
	siteName?: string;
	canonicalUrl?: string;
	ogImage?: string;
	/** Article `og:description` to restore when route meta is cleared. */
	description?: string;
};
