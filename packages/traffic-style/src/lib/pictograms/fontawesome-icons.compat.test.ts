import {expect, it} from "vitest";

/**
 * The Font Awesome pictogram importer depends on named exports from
 * @fortawesome/free-solid-svg-icons. Keep this list in sync with
 * scripts/dev/import-fontawesome.ts so major bumps cannot drop icons
 * we ship without failing CI.
 */
const requiredIcons = [
	"faBicycle",
	"faBiking",
	"faBolt",
	"faBus",
	"faCar",
	"faChargingStation",
	"faCloudRain",
	"faCloudSunRain",
	"faDroplet",
	"faHospital",
	"faInfo",
	"faLeaf",
	"faLocationDot",
	"faMugHot",
	"faSchool",
	"faTemperatureHigh",
	"faTree",
	"faUsers",
	"faUtensils",
	"faVanShuttle",
	"faWater",
] as const;

it("exports every Font Awesome icon used by the pictogram importer", async () => {
	const mod = await import("@fortawesome/free-solid-svg-icons");

	for (const name of requiredIcons) {
		const icon = mod[name];
		expect(icon, name).toBeTruthy();
		expect(icon.icon).toBeTruthy();
		const [, , , , pathData] = icon.icon;
		expect(
			typeof pathData === "string" || Array.isArray(pathData),
			`${name} path data`,
		).toBe(true);
	}
});
