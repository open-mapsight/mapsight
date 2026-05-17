import {create} from "./index";
import serverStringRenderer from "./renderer/server-string";

const defaultUrlPrefix = "/mapsight/";

export default function createServerHandler(urlPrefix = defaultUrlPrefix) {
	return (req, res, next) => {
		if (req.url.indexOf(urlPrefix) !== 0) {
			next();
			return;
		}

		const options = req.body.options;
		if (!options) {
			res.writeHead(400);
			console.error("empty request");
			res.end();
			return;
		}

		res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});

		const {baseMapsightConfig = {}, createOptions = {}} = options;
		createOptions.renderer = serverStringRenderer;

		const {render} = create(null, null, baseMapsightConfig, createOptions);

		render();
		const html = render();
		res.write(html);

		// We are showing a feature detail?
		//const featureId = options.feature;
		//if (featureId) {
		//	mapsight.dispatch(selectExclusively(FEATURE_SELECTIONS, FEATURE_SELECTION_SELECT, featureId));
		//}
		res.end();
	};
}
