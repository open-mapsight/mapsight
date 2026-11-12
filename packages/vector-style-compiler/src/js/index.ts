import cssToRules from "./cssToRules.ts";
import findStyleWarnings from "./findStyleWarnings.ts";
import rulesToTree from "./rulesToTree.ts";
import defaultTemplate, {type Template} from "./template.ts";
import treeToProgram from "./treeToProgram.ts";

export type Options = {
	template?: Template;
	additionalData?: Record<string, string | number>;
	baseIndent?: number;
	/**
	 * Called once per warning about the style source, for example a style
	 * that sets `circle-*` properties without `image-type`. Warnings never
	 * change the generated output. Without a callback they are dropped.
	 */
	onWarning?: (message: string) => void;
};

export default function compileMapsightVectorStyle(
	content: string,
	{
		template = defaultTemplate,
		additionalData = {},
		baseIndent = 2,
		onWarning,
	}: Options = {},
) {
	const rules = cssToRules(content);
	if (onWarning) {
		findStyleWarnings(rules.rules).forEach((message) => onWarning(message));
	}
	const tree = rulesToTree(rules.rules);
	return template({
		__meta: rules.__meta,
		program0:
			rules.__meta.volatileCalcExpressions.length > 0
				? treeToProgram(tree, "volatileHash", baseIndent)
				: "",
		program1: treeToProgram(tree, "hash", baseIndent),
		program2: treeToProgram(tree, "declaration", baseIndent),
		...additionalData,
	});
}
