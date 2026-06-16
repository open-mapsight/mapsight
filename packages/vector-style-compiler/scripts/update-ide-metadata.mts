import {mkdir, readFile, writeFile} from "node:fs/promises";
import {resolve} from "node:path";

type CustomCssProperty = {
	name: string;
	description: string;
	docUrl?: string;
	references?: Array<{
		name: string;
		url: string;
	}>;
	deprecated: boolean | string;
	sinceVersion: string;
};

type IdeCssProperty = CustomCssProperty & {
	aliasKind?: "case" | "nested" | "namespace" | "ambiguous";
	aliasOf?: string;
};

type PackageJson = {
	description?: string;
	name: string;
	version: string;
};

const packageRoot = resolve(import.meta.dirname, "..");
const generatedDir = resolve(packageRoot, "src/data/generated");
const docsReference =
	"https://github.com/open-mapsight/mapsight/blob/main/packages/vector-style-compiler/README.md";

const documentedStatePseudoClasses = [
	{
		name: ":selected",
		description: "Matches selected Mapsight vector features.",
	},
	{
		name: ":highlighted",
		description: "Matches highlighted Mapsight vector features.",
	},
];

const mapsightCssFunctions = [
	{
		name: "attr",
		description:
			"Reads a feature property, or an environment value when using the --env- prefix.",
	},
	{
		name: "mapsightRuntimeIcon",
		description:
			"Returns a synchronous runtime icon URL and participates in volatile style cache hashing.",
	},
	{
		name: "replace",
		description:
			"Performs a string replacement while compiling Mapsight vector style values.",
	},
];

const segmentCaseAliases = new Map([
	["anchorx", "anchorX"],
	["anchory", "anchorY"],
	["linedash", "lineDash"],
	["offsetx", "offsetX"],
	["offsety", "offsetY"],
	["sizex", "sizeX"],
	["sizey", "sizeY"],
	["snaptopixel", "snapToPixel"],
	["textalign", "textAlign"],
	["textbaseline", "textBaseline"],
]);

function createNameVariants(name: string) {
	const segments = name.split("-");
	const variants = segments.reduce<Array<Array<string>>>(
		(acc, segment) => {
			const segmentVariants = [
				segment,
				segmentCaseAliases.get(segment),
			].filter((variant): variant is string => !!variant);

			return acc.flatMap((variant) =>
				segmentVariants.map((segmentVariant) => [
					...variant,
					segmentVariant,
				]),
			);
		},
		[[]],
	);

	return variants.map((variant) => variant.join("-"));
}

function createPropertyAlias(
	property: CustomCssProperty,
	name: string,
	aliasKind: IdeCssProperty["aliasKind"],
): IdeCssProperty {
	return {
		name,
		description: "",
		docUrl: property.docUrl,
		references: property.references,
		deprecated: property.deprecated,
		sinceVersion: property.sinceVersion,
		aliasKind,
		aliasOf: property.name,
	};
}

function addPropertyAlias(
	properties: Map<string, IdeCssProperty>,
	property: CustomCssProperty,
	name: string,
	aliasKind: IdeCssProperty["aliasKind"],
) {
	for (const nameVariant of createNameVariants(name)) {
		const existingProperty = properties.get(nameVariant);
		if (existingProperty) {
			if (
				existingProperty.aliasKind &&
				existingProperty.aliasOf !== property.name
			) {
				properties.set(nameVariant, {
					name: nameVariant,
					description: "",
					deprecated: false,
					sinceVersion: property.sinceVersion,
					aliasKind: "ambiguous",
				});
			}
			continue;
		}
		properties.set(
			nameVariant,
			createPropertyAlias(property, nameVariant, aliasKind),
		);
	}
}

function createIdeCssProperties(customCssProperties: CustomCssProperty[]) {
	const properties = new Map<string, IdeCssProperty>();

	for (const property of customCssProperties) {
		properties.set(property.name, property);
		addPropertyAlias(properties, property, property.name, "case");

		const parts = property.name.split("-");
		for (let i = 1; i < parts.length; i++) {
			addPropertyAlias(
				properties,
				property,
				parts.slice(0, i).join("-"),
				"namespace",
			);
			addPropertyAlias(
				properties,
				property,
				parts.slice(i).join("-"),
				"nested",
			);
		}
	}

	return Array.from(properties.values());
}

function descriptionFor(property: IdeCssProperty) {
	if (property.description) {
		return property.description;
	}

	if (property.aliasKind === "case" && property.aliasOf) {
		return `Case-preserving alias for Mapsight vector style property ${property.aliasOf}.`;
	}
	if (property.aliasKind === "namespace" && property.aliasOf) {
		return `Sass nested namespace for Mapsight vector style properties matching ${property.name}-*.`;
	}
	if (property.aliasKind === "nested" && property.aliasOf) {
		return `Nested form of Mapsight vector style property ${property.aliasOf}.`;
	}
	if (property.aliasKind === "ambiguous") {
		return "Nested Mapsight vector style property segment. The exact OpenLayers option depends on the surrounding Sass property namespace.";
	}

	return (
		property.description ||
		`Mapsight vector style property. Since ${property.sinceVersion}.`
	);
}

function createCssCustomData(customCssProperties: IdeCssProperty[]) {
	return {
		$schema:
			"https://raw.githubusercontent.com/microsoft/vscode-css-languageservice/main/docs/customData.schema.json",
		version: 1.1,
		properties: customCssProperties.map((property) => ({
			name: property.name,
			description: descriptionFor(property),
			status: property.deprecated ? "obsolete" : "nonstandard",
			references: [
				...(property.docUrl
					? [
							{
								name: "OpenLayers style docs",
								url: property.docUrl,
							},
						]
					: []),
				...(property.references ?? []),
				{
					name: "Mapsight vector style properties",
					url: docsReference,
				},
			],
		})),
		atDirectives: [],
		pseudoClasses: documentedStatePseudoClasses,
		pseudoElements: [],
	};
}

function createWebTypesData(
	customCssProperties: IdeCssProperty[],
	packageJson: PackageJson,
) {
	return {
		$schema: "https://json.schemastore.org/web-types",
		name: packageJson.name,
		version: packageJson.version,
		description:
			packageJson.description ||
			"Mapsight vector style compiler IDE metadata.",
		contributions: {
			css: {
				properties: customCssProperties.map((property) => ({
					name: property.name,
					description: descriptionFor(property),
					deprecated: property.deprecated,
					"doc-url": property.docUrl ?? docsReference,
				})),
				"pseudo-classes": documentedStatePseudoClasses.map(
					(pseudoClass) => ({
						name: pseudoClass.name.slice(1),
						description: pseudoClass.description,
					}),
				),
				functions: mapsightCssFunctions.map((fn) => ({
					name: fn.name,
					description: fn.description,
					"doc-url": docsReference,
				})),
			},
		},
	};
}

async function readJson<T>(file: string): Promise<T> {
	return JSON.parse(await readFile(file, "utf8")) as T;
}

async function writeJson(file: string, data: unknown) {
	await writeFile(file, JSON.stringify(data, null, "\t") + "\n");
}

async function main() {
	const customCssProperties = await readJson<CustomCssProperty[]>(
		resolve(packageRoot, "src/data/custom-css-properties.json"),
	);
	const packageJson = await readJson<PackageJson>(
		resolve(packageRoot, "package.json"),
	);
	const ideCssProperties = createIdeCssProperties(customCssProperties);

	await mkdir(generatedDir, {recursive: true});
	await writeJson(
		resolve(generatedDir, "mapsight-vector-style.css-data.json"),
		createCssCustomData(ideCssProperties),
	);
	await writeJson(
		resolve(generatedDir, "mapsight-vector-style.web-types.json"),
		createWebTypesData(ideCssProperties, packageJson),
	);
}

main().catch((error: unknown) => {
	console.error(error);
	process.exitCode = 1;
});
