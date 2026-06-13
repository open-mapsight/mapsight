import type {HostEmbedConfig} from "@mapsight/vite-host-embed";

export type CountAggregatorAppShellEmbedConfig = {
	/** Build output directory relative to the app root. */
	outDir: string;
	/** Snippet output directory relative to the app root. */
	snippetsDir: string;
	/** Snippet filename without `.html`. */
	snippetName: string;
	/** Built HTML path relative to `outDir`. */
	builtHtmlRelativePath: string;
	/** Optional deploy subtree to remove after snippet extraction. */
	removeFromDeployRelativePath?: string;
	/** Deploy prefix for rewritten asset URLs in built CSS/JS. */
	assetsRewriteBase: string;
	/** Apache rewrite base for generated `.htaccess`. */
	htaccessBase: string;
	/** Cache header config for stable entry files. */
	cacheConfig: Pick<
		HostEmbedConfig,
		"runtimeEntry" | "appStylesheet" | "embedTypeEntries"
	>;
	/** Snippet file header description. */
	snippetDescription?: string;
};
