import type {NextConfig} from "next";

const nextConfig: NextConfig = {
	/* config options here */
	reactCompiler: true,

	sassOptions: {
		verbose: false,
		quiet: true,
		quietDeps: true,
		silenceDeprecations: [
			"import",
			"slash-div",
			"color-functions",
			"color-module-compat",
		],
		loadPaths: ["node_modules"],
	},
};

export default nextConfig;
