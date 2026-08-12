import nodeEmbed from "./embed/node";

const defaultUrlPrefix = "/mapsight/";

/**
 * Express-style middleware: POST body.options → HTML embed fragment with
 * data-dehydrated-state (see docs/integration/SSR_HYDRATION.md).
 *
 * Expected `req.body.options`:
 * `{ styleFunction, baseMapsightConfig, createOptions?, containerId, containerClassName? }`
 */
export default function createServerHandler(urlPrefix = defaultUrlPrefix) {
	return (req, res, next) => {
		if (req.url.indexOf(urlPrefix) !== 0) {
			next();
			return;
		}

		const options = req.body?.options;
		if (!options) {
			res.writeHead(400, {"Content-Type": "text/plain; charset=utf-8"});
			console.error("mapsight ui server-handler: empty request");
			res.end("missing options");
			return;
		}

		const {
			styleFunction,
			baseMapsightConfig = {},
			createOptions = {},
			containerId,
			containerClassName,
		} = options;

		if (!styleFunction || !containerId) {
			res.writeHead(400, {"Content-Type": "text/plain; charset=utf-8"});
			console.error(
				"mapsight ui server-handler: styleFunction and containerId are required",
			);
			res.end("styleFunction and containerId are required");
			return;
		}

		try {
			const embed = nodeEmbed({
				styleFunction,
				baseMapsightConfig,
				createOptions,
			});
			embed.render();
			const fragment = embed.emitFragment({
				id: containerId,
				className: containerClassName,
			});

			res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});
			res.write(fragment);
			res.end();
		} catch (error) {
			console.error("mapsight ui server-handler: render failed", error);
			res.writeHead(500, {"Content-Type": "text/plain; charset=utf-8"});
			res.end("render failed");
		}
	};
}
