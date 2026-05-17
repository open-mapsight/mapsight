import {resolve} from "node:path";

import {defineConfig} from "vite";

// https://vitejs.dev/config/
export default defineConfig({
	optimizeDeps: {
		//include: ['@mapsight/ol-proxy'],
	},
	build: {
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html"),
				nested: resolve(__dirname, "vector-editor.html"),
			},
		},
		commonjsOptions: {
			//include: [/@mapsight\/core/, /@mapsight\/lib-redux/],
		},
	},
});
