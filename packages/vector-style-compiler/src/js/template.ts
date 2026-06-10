import {readFileSync} from "node:fs";
import {resolve} from "node:path";

import createHelperImportsFromProgram from "./helpers/createHelperImportsFromProgram.ts";
import createModulesMapFromDependencies from "./helpers/createModulesMapFromDependencies.ts";

export type TemplateArgs<
	TAdditionalData extends Record<string, unknown> = Record<string, unknown>,
> = TAdditionalData & {
	__meta: {
		styleNames: string[];
		stateNames: string[];
		groupNames: string[];
		declarationNames: string[];
		styleProps: string[];
		stylePropExpressions: string[];
	};
	program1: string;
	program2: string;
	program0?: string;
};
export type Template<
	TAdditionalData extends Record<string, unknown> = Record<string, unknown>,
> = (args: TemplateArgs<TAdditionalData>) => string;

const templateSource = readFileSync(
	resolve(import.meta.dirname, "template.source.js"),
	"utf8",
);

const replaceTag = (content: string, tag: string, value: string) => {
	const pattern = `\\/\\*\\s*${tag}-start:\\s*\\*\\/[\\s\\S]*?\\/\\*\\s*:${tag}-end\\s*\\*\\/`;
	return content.replace(new RegExp(pattern, "g"), () => value);
};

const defaultTemplate = ({
	__meta,
	program1,
	program2,
	program0 = "",
}: TemplateArgs) => {
	const {declarationNames, styleProps, styleNames} = __meta;
	const {map: constructorMap, imports: styleImports} =
		createModulesMapFromDependencies(declarationNames);
	const helperImports = createHelperImportsFromProgram(
		`${program0}\n${program1}\n${program2}`,
	);
	const combinedImports = [styleImports, helperImports]
		.filter(Boolean)
		.join("\n");

	let result = "// @ts-nocheck\n" + templateSource;
	result = replaceTag(result, "imports", combinedImports);
	result = replaceTag(result, "constructorMap", constructorMap);
	result = replaceTag(result, "styleNames", JSON.stringify(styleNames));
	result = replaceTag(result, "styleProps", JSON.stringify(styleProps));
	result = replaceTag(result, "program0", program0);
	result = replaceTag(result, "program1", program1);
	result = replaceTag(result, "program2", program2);

	// Strip source map comments injected by tsc or other tooling.
	result = result.replace(/\/\/# sourceMappingURL=[^\n]*/g, "");
	result = result.replace(/\/\*# sourceMappingURL=[^*]*\*\//g, "");

	return result;
};

export default defaultTemplate;
