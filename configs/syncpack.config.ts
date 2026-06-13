import type {RcFile} from "syncpack";

/** Copy-out templates: explicit semver pins only (no catalog:/workspace:). */
const STARTER_PACKAGES = [
	"mapsight-host-starter",
	"mapsight-next-starter",
	"mapsight-vite-spa-starter",
] as const;

export default {
	sortPackages: true,
	sortFirst: ["name", "description", "version", "private", "type"],
	indent: "\t",
	versionGroups: [
		{
			label: "Copy-out starters use explicit npm semver pins",
			packages: [...STARTER_PACKAGES],
			isIgnored: true,
		},
	],
	semverGroups: [
		{
			label: "Copy-out starters use explicit npm semver pins",
			packages: [...STARTER_PACKAGES],
			isIgnored: true,
		},
	],
} satisfies RcFile;
