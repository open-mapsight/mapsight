import path from "node:path";
import {fileURLToPath} from "node:url";

import {defineConfig} from "vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	root: dirname,
	resolve: {
		alias: {
			"@": path.resolve(dirname, "../src/js"),
		},
	},
	server: {
		host: "127.0.0.1",
		port: 5173,
		strictPort: true,
	},
});
