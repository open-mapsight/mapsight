import {setDocumentLanguage} from "../../helpers/i18n";
import type {PluginInstance} from "../../types";

/**
 * This plugin will apply a lang from the embedOptions to i18n
 *
 * @param [_options] options
 * @returns plugin instance
 */
export default function createLangPlugin(_options = {}): PluginInstance {
	return {
		beforeRender: function pluginLangBeforeRender(context) {
			const {lang} = context.createOptions;
			if (lang) setDocumentLanguage(lang);
		},
	};
}
