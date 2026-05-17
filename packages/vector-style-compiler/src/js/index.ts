import cssToRules from "./cssToRules.ts";
import rulesToTree from "./rulesToTree.ts";
import defaultTemplate, {type Template} from "./template.ts";
import treeToProgram from "./treeToProgram.ts";

export type Options = {
	template?: Template;
	additionalData?: Record<string, string | number>;
	baseIndent?: number;
};

export default function compileMapsightVectorStyle(
	content: string,
	{
		template = defaultTemplate,
		additionalData = {},
		baseIndent = 2,
	}: Options = {},
) {
	const rules = cssToRules(content);
	const tree = rulesToTree(rules.rules);
	return template({
		__meta: rules.__meta,
		program1: treeToProgram(tree, "hash", baseIndent),
		program2: treeToProgram(tree, "declaration", baseIndent),
		...additionalData,
	});
}
