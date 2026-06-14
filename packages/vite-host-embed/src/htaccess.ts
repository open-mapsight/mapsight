import type {HostEmbedCacheConfig, HostEmbedConfig} from "./types.ts";

export function buildCacheControlBlock(config: HostEmbedCacheConfig): string {
	const typeEntryPattern = Object.keys(config.embedTypeEntries).join("|");
	const escapedStylesheet = config.appStylesheet.replace(".", "\\.");

	return `# Cache: stable entry files revalidate; hashed chunks are immutable.
<IfModule mod_headers.c>
	<FilesMatch "-[a-zA-Z0-9_-]{8,}\\.(js|css)$">
		Header set Cache-Control "public, max-age=31536000, immutable"
	</FilesMatch>

	<FilesMatch "^(${typeEntryPattern}|${config.runtimeEntry})\\.js$">
		Header set Cache-Control "no-cache"
	</FilesMatch>

	<FilesMatch "^${escapedStylesheet}$">
		Header set Cache-Control "no-cache"
	</FilesMatch>
</IfModule>
`;
}

export function buildHtaccess(config: HostEmbedConfig): string {
	const snippetsDir = config.snippetsDir ?? "dist/snippets";

	return `# Mapsight host embed static assets under ${config.assetsBase}/.
# Page HTML comes from the host CMS (paste ${snippetsDir}/*.html body into pages or templates).
<IfModule mod_rewrite.c>
	RewriteEngine On
	RewriteBase ${config.assetsBase}/

	RewriteRule ^assets/ - [L]
	RewriteRule ^img/ - [L]
	RewriteRule ^data/ - [L]
</IfModule>

${buildCacheControlBlock(config)}
`;
}
