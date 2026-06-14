import type {HostEmbedConfig} from "./types.ts";

export function renderSnippetsReadme(config: HostEmbedConfig): string {
	const deployDir = config.outDir ?? "dist/mapsight-assets";
	const snippetsDir = config.snippetsDir ?? "dist/snippets";

	return `# Mapsight embed snippets

Paste-ready HTML for CMS pages and host templates. **Do not upload this folder** — deploy only \`${deployDir}/\`.

After each production build, copy the body from the relevant \`.html\` file into your CMS page or template. Regenerate when embed assets are redeployed.

Deploy prefix in this build: \`${config.assetsBase}\`

## Integration guides

- [CMS / PHP embed pattern](https://github.com/open-mapsight/mapsight/blob/main/docs/integration/CMS_PHP.md)
- [For CMS editors](https://github.com/open-mapsight/mapsight/blob/main/docs/integration/CMS_EDITORS.md)
- [Config reference](https://github.com/open-mapsight/mapsight/blob/main/docs/integration/CONFIG_REFERENCE.md)
- [Host starter](https://github.com/open-mapsight/mapsight/tree/main/starters/mapsight-host-starter)

Generated under \`${snippetsDir}/\` by [\`@mapsight/vite-host-embed\`](https://github.com/open-mapsight/mapsight/tree/main/packages/vite-host-embed).
${config.snippetsReadmeExtra ? `\n${config.snippetsReadmeExtra}` : ""}`;
}
