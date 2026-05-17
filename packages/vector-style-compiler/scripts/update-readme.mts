import {readFile} from "node:fs/promises";
import {resolve} from "node:path";

import {type ReplaceInFileConfig, replaceInFile} from "replace-in-file";

import {escapeRegExp} from "@mapsight/lib-js/regExp";

type CustomCssProperty = {
	name: string;
	description: string;
	deprecated: boolean | string;
	sinceVersion: string;
};

type ReplaceOptions = Omit<ReplaceInFileConfig, "files" | "processor"> &
	Required<Pick<ReplaceInFileConfig, "from" | "to">>;

async function replaceWithLog(file: string, options: ReplaceOptions) {
	try {
		const changes = await replaceInFile({files: file, ...options});
		const changedFiles = changes
			.filter(({hasChanged}) => hasChanged)
			.map(({file}) => file);

		if (changedFiles.length) {
			console.log("Modified files:", changedFiles.join(", "));
		} else {
			console.log("No changes!");
		}
	} catch (error) {
		console.error("Error occurred:", error);
	}
}

function replaceTagContents(tagName: string, to: string): ReplaceOptions {
	const tagNameEscaped = escapeRegExp(tagName);

	return {
		from: new RegExp(
			`<!--\\s*?${tagNameEscaped}:\\s*?-->[\\w\\W]*?<!--\\s*?:${tagNameEscaped}\\s*?-->`,
			"gi",
		),
		to: `<!-- ${tagName}: -->

${to}<!-- :${tagName} -->`,
	};
}

const docsTemplate = (a: CustomCssProperty) =>
	`#### ${a.name}

${`Description: ${a.description}`.trim()}

Since version: ${a.sinceVersion}

${
	a.deprecated
		? "NOTE: Deprecated" +
			(typeof a.deprecated === "string" ? ": " + a.deprecated : "!")
		: ""
}`;

async function main(): Promise<void> {
	// TODO: move "src/data/custom-css-properties.json" out of the src dir.
	// 1. it's not used for/in the pkg output (aka dist)
	// 2. the only code reading that file is this one and it's not part of the src dir
	const filePath = resolve(
		import.meta.dirname,
		"../src/data/custom-css-properties.json",
	);

	const data = await readFile(filePath, "utf8");

	const customCssProperties = JSON.parse(data) as Array<CustomCssProperty>;
	const customCssPropertiesList = customCssProperties
		.map((a) => a.name)
		.join(",");
	const customCssPropertiesDocs = customCssProperties
		.map(docsTemplate)
		.join("");

	await replaceWithLog(
		"README.md",
		replaceTagContents(
			"CUSTOM_CSS_PROPERTIES_LIST",
			customCssPropertiesList,
		),
	);
	await replaceWithLog(
		"README.md",
		replaceTagContents(
			"CUSTOM_CSS_PROPERTIES_DOCS",
			customCssPropertiesDocs,
		),
	);
}

main().catch(console.error);
