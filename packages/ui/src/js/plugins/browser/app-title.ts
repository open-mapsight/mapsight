import {setAppTitle} from "../../store/actions";
import type {PluginInstance} from "../../types.ts";

const defaultRendererPropName = "title";

/**
 * This plugin will apply a title on render passed as a prop to the renderer.
 *
 * @param [options] options currently not used
 * @param [options.rendererPropName="title"] title property name passed to the renderer
 * @returns plugin instance
 */
export default function createPlugin(
	options: {
		rendererPropName?: string;
	} = {},
): PluginInstance {
	const {rendererPropName = defaultRendererPropName} = options;

	return {
		beforeRender: function appTitleRenderPlugin(context) {
			const {store, rendererProps} = context;

			if (!store || !rendererProps) {
				return;
			}

			if (
				rendererPropName in rendererProps &&
				rendererProps[rendererPropName]
			) {
				store.dispatch(setAppTitle(rendererProps[rendererPropName]));
			}
		},
	};
}
