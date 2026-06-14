export type HostEmbedSnippetConfig = {
	/** Full snippet file contents extracted from marked HTML. */
	contents: string;
};

export type HostEmbedConfig = {
	/** Deploy URL prefix for static assets, e.g. `/mapsight-assets`. */
	assetsBase: string;
	/** Shared runtime entry basename (without `.js`). */
	runtimeEntry: string;
	/** Stable app stylesheet filename written after the embed build. */
	appStylesheet: string;
	/** Public script name → Vite lib entry module path (used for cache headers). */
	embedTypeEntries: Record<string, string>;
	/** Output directory relative to the app root. Default: `dist/mapsight-assets`. */
	outDir?: string;
	/** Snippet output directory relative to the app root (not deployed). Default: `dist/snippets`. */
	snippetsDir?: string;
	/** Prefer a hashed CSS entry matching this prefix when stabilizing the stylesheet. */
	appStylesheetPrefix?: string;
	/** Dev CSS entry for `${assetsBase}/assets/${appStylesheet}`. Default: `entries/mapsight.entry.css`. */
	appStylesheetEntry?: string;
	/** Relative path from app root for icon copies. Default: `public/img`. */
	imgDir?: string;
	/** Relative path from app root for data copies. Default: `public/data`. Skipped when missing. */
	dataDir?: string;
	/** Extra markdown appended to the generated snippets README. */
	snippetsReadmeExtra?: string;
	/** Write Apache `.htaccess` beside deploy assets. Default: `true`. */
	writeHtaccess?: boolean;
	/** HTML files with `<!-- mapsight:snippet:start/end -->` regions to extract at build time. */
	snippetSources: HostEmbedSnippetSource[];
};

export type HostEmbedCacheConfig = Pick<
	HostEmbedConfig,
	"runtimeEntry" | "appStylesheet" | "embedTypeEntries"
>;

export type HostEmbedSnippetSource = {
	/** Output filename without `.html`, e.g. `simple`. */
	name: string;
	/** HTML file path relative to the app root. */
	file: string;
	/** Optional description in the generated snippet file header. */
	description?: string;
};
