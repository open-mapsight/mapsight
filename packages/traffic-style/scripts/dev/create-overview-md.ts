#!/usr/bin/env node
import {readFile, readdir} from "fs/promises";

import {markdownTable} from "markdown-table";

interface Icon {
	fileName: string;
	name: string;
	variant: string;
	suffix: string;
}

interface MetaIcon {
	label: {
		de: string;
		en: string;
	};
	aliases?: string[];
	groups?: string[];
}

interface MetaData {
	icons: Record<string, MetaIcon>;
}

function parseIconName(fileName: string): Icon {
	const parts = fileName.split(".");
	if (parts.length < 2) {
		throw new Error("Invalid file name: no extension");
	}
	const [main = "", suffix = ""] = parts;
	const nameParts = main.split("-");
	if (nameParts.length < 1) {
		throw new Error("Invalid file name: no variant");
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

function iconGroupsToRows(
	variants: string[],
	iconGroups: Record<string, Record<string, Icon>>,
	imgPath: string,
	metaData: MetaData,
): string[][] {
	return Object.keys(iconGroups).map((name) => [
		name,
		metaData.icons[name]?.label.de || "",
		metaData.icons[name]?.label.en || "",
		...variants.map((variant) => {
			const icon = iconGroups[name]?.[variant];

			return icon
				? `![${icon.fileName}](${imgPath + icon.fileName})`
				: "-/-";
		}),
		metaData.icons[name]?.aliases
			? JSON.stringify(metaData.icons[name].aliases)
			: "",
		metaData.icons[name]?.groups
			? JSON.stringify(metaData.icons[name].groups)
			: "",
	]);
}

async function main() {
	const argv = process.argv;
	const [, , srcPath, imgPath] = argv;
	if (!srcPath) {
		throw new Error("argument srcPath missing");
	}
	if (!imgPath) {
		throw new Error("argument imgPath missing");
	}

	const metaDataContent = await readFile("src/meta.json", "utf8");
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const metaData: MetaData = JSON.parse(metaDataContent);

	const files = await readdir(srcPath);
	const icons = files
		.filter((fileName) => /(\.webp|\.png|\.svg)$/.test(fileName))
		.map((iconFile) => parseIconName(iconFile));
	const variants = [...new Set(icons.map(({variant}) => variant))];
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

	const iconTable = [
		["Name", "Label (de)", "Label (en)", ...variants, "Aliases", "Groups"],
		...iconGroupsToRows(variants, iconGroups, imgPath, metaData),
	];

	console.log(markdownTable(iconTable));
}

main().catch(console.error);
