#!/usr/bin/env node
import {readFile, readdir} from "node:fs/promises";
import path from "node:path";

const colors = {
	red: (str: string) => `\x1b[31m${str}\x1b[0m`,
	yellow: (str: string) => `\x1b[33m${str}\x1b[0m`,
};

interface Icon {
	fileName: string;
	name: string;
	variant: string;
	suffix: string;
}

interface MetaIcon {
	label?: {
		de: string;
		en: string;
	};
	aliases?: string[];
	groups?: string[];
	render?: "sprite" | "composable";
	colors?: {
		background?: string;
		foreground?: string;
	};
}

interface MetaData {
	icons?: Record<string, MetaIcon>;
	copyright?: string;
	defaultIcon?: string;
}

interface PackageJson {
	name: string;
	version: string;
}

interface ResultIcon extends MetaIcon {
	id: string;
	variants: string[];
}

interface Result {
	name: string;
	version: string;
	copyright: string;
	defaultIcon?: string;
	icons: ResultIcon[];
}

function parseIconName(fileName: string): Icon {
	const parts = fileName.split(".");
	if (parts.length < 2) {
		throw new Error("Invalid file name: no extension");
	}
	const main = parts[0]!;
	const suffix = parts[1]!;
	const nameParts = main.split("-");
	if (nameParts.length < 1) {
		throw new Error("Invalid file name: no parts");
	}
	const variant = nameParts.pop()!;
	const name = nameParts.join("-");

	return {
		fileName,
		name,
		variant,
		suffix,
	};
}

async function main() {
	const argv = process.argv;
	const [, , metaPath, srcPath] = argv;

	if (!metaPath) {
		throw new Error("argument metaPath missing");
	}
	if (!srcPath) {
		throw new Error("argument srcPath missing");
	}

	const metaDataContent = await readFile(path.resolve(metaPath), "utf8");
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const metaData: MetaData = JSON.parse(metaDataContent);

	const packageJsonContent = await readFile("package.json", "utf8");
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const packageJson: PackageJson = JSON.parse(packageJsonContent);

	if (!metaData.icons) {
		console.error(
			colors.red("ERROR: No Icons field found in src/meta.json!"),
		);
	}

	const result: Result = {
		name: packageJson.name,
		version: packageJson.version,
		copyright: metaData.copyright || "Open Mapsight",
		defaultIcon: metaData.defaultIcon,
		icons: [],
	};

	const files = await readdir(srcPath);
	const icons = files
		.filter((fileName) => /(\.webp|\.png|\.svg)$/.test(fileName))
		.map((iconFile) => parseIconName(iconFile));
	const iconGroups = icons.reduce(
		(groups, icon) => ({
			...groups,
			[icon.name]: {
				...(groups[icon.name] || {}),
				[icon.variant]: icon,
			},
		}),
		{} as Record<string, Record<string, Icon>>,
	);

	Object.keys(iconGroups).forEach((name) => {
		if (metaData.icons && !metaData.icons[name]) {
			console.warn(
				colors.yellow(
					'WARNING: Icon "' +
						name +
						'" is not specified in src/meta.json!',
				),
			);
		}

		result.icons.push({
			...((metaData.icons && metaData.icons[name]) || {}),
			id: name,
			variants: Object.keys(iconGroups[name] ?? {}).sort(),
		});
	});

	const composableVariants = ["default", "small", "xsmall", "plain"];
	Object.entries(metaData.icons ?? {}).forEach(([name, iconMeta]) => {
		if (iconMeta.render !== "composable") {
			return;
		}
		if (result.icons.some((icon) => icon.id === name)) {
			return;
		}

		result.icons.push({
			...iconMeta,
			id: name,
			variants: composableVariants,
		});
	});

	result.icons.sort((left, right) => left.id.localeCompare(right.id));

	console.log(JSON.stringify(result, null, 4));
}

main().catch(console.error);
