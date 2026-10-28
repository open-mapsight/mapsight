import path from "node:path";
import {pathToFileURL} from "node:url";

import {
	MAPSIGHT_ENGLISH_LEXICON,
	MAPSIGHT_MAP,
	MAPSIGHT_OWNERS,
} from "./presets/mapsight.ts";
import type {AuditConfig, ResolvedConfig, Viewport} from "./types.ts";

export const DEFAULT_VIEWPORTS: Viewport[] = [
	{
		id: "desktop",
		width: 1280,
		height: 800,
		checks: [
			"axe",
			"keyboard",
			"dialogs",
			"map",
			"language",
			"text-spacing",
		],
	},
	{
		id: "mobile",
		width: 390,
		height: 844,
		isMobile: true,
		hasTouch: true,
		checks: ["axe", "keyboard", "dialogs"],
	},
	{
		id: "reflow",
		width: 320,
		height: 640,
		checks: ["axe", "reflow"],
	},
];

export const DEFAULT_AXE_TAGS = [
	"wcag2a",
	"wcag2aa",
	"wcag21a",
	"wcag21aa",
	"wcag22aa",
	"best-practice",
];

/** Identity helper for typed config files. */
export function defineConfig(config: AuditConfig): AuditConfig {
	return config;
}

export function resolveConfig(config: AuditConfig): ResolvedConfig {
	if (!config.targets?.length) {
		throw new Error("Audit config needs at least one target.");
	}
	for (const timeout of [
		config.navigationTimeoutMs,
		...config.targets.map((target) => target.navigationTimeoutMs),
	]) {
		if (
			timeout !== undefined &&
			(!Number.isFinite(timeout) || timeout <= 0)
		) {
			throw new Error(
				"navigationTimeoutMs must be a positive finite number.",
			);
		}
	}
	const preset = config.preset ?? "mapsight";
	const mapsight = preset === "mapsight";
	const viewports = config.viewports ?? DEFAULT_VIEWPORTS;
	const viewportIds = new Set(viewports.map((viewport) => viewport.id));
	const targetIds = new Set<string>();
	for (const target of config.targets) {
		if (targetIds.has(target.id)) {
			throw new Error(`Duplicate target id "${target.id}".`);
		}
		targetIds.add(target.id);
		for (const id of target.viewports ?? []) {
			if (!viewportIds.has(id)) {
				throw new Error(
					`Target "${target.id}" uses unknown viewport "${id}".`,
				);
			}
		}
		const scenarioIds = new Set<string>();
		for (const scenario of target.scenarios ?? []) {
			if (scenarioIds.has(scenario.id) || scenario.id === "initial") {
				throw new Error(
					`Target "${target.id}": scenario id "${scenario.id}" is reserved or duplicate.`,
				);
			}
			scenarioIds.add(scenario.id);
		}
	}
	return {
		name: config.name,
		baseUrl: config.baseUrl,
		navigationTimeoutMs: config.navigationTimeoutMs ?? 60_000,
		locale: config.locale ?? "de-DE",
		preset,
		owners: [
			...(config.owners ?? []),
			...(mapsight ? MAPSIGHT_OWNERS : []),
		],
		hostOwner: config.hostOwner ?? "host-page",
		viewports,
		targets: config.targets,
		map: {...MAPSIGHT_MAP, ...config.map},
		englishLexicon: [
			...(mapsight ? MAPSIGHT_ENGLISH_LEXICON : []),
			...(config.englishLexicon ?? []),
		],
		axeTags: config.axeTags ?? DEFAULT_AXE_TAGS,
		axeDisableRules: config.axeDisableRules ?? [],
		maxTabStops: config.maxTabStops ?? 150,
		maxDialogTriggers: config.maxDialogTriggers ?? 20,
	};
}

export async function loadConfig(file: string): Promise<AuditConfig> {
	const url = pathToFileURL(path.resolve(file)).href;
	const module = (await import(url)) as {default?: AuditConfig};
	if (!module.default) {
		throw new Error(`${file} has no default export.`);
	}
	return module.default;
}

export function targetUrl(url: string, baseUrl?: string): string {
	return new URL(url, baseUrl).href;
}
