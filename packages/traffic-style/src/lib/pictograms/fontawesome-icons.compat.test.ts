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
	"faBoxesPacking",
	"faBuilding",
	"faBus",
	"faCar",
	"faChair",
	"faChargingStation",
	"faCloudRain",
	"faCloudShowersWater",
	"faCloudSun",
	"faCloudSunRain",
	"faDroplet",
	"faDumpster",
	"faFaucetDrip",
	"faGasPump",
	"faGlassWaterDroplet",
	"faHandHoldingDroplet",
	"faHospital",
	"faInfo",
	"faLeaf",
	"faLocationDot",
	"faMugHot",
	"faPersonBiking",
	"faPersonShelter",
	"faPersonWalking",
	"faRecycle",
	"faRoute",
	"faSchool",
	"faSeedling",
	"faSkullCrossbones",
	"faSnowflake",
	"faTemperatureHigh",
	"faTemperatureLow",
	"faTowerBroadcast",
	"faTree",
	"faTruck",
	"faTruckFast",
	"faTruckRampBox",
	"faUmbrella",
	"faUsers",
	"faUtensils",
	"faVanShuttle",
	"faWarehouse",
	"faWater",
	"faWaterLadder",
	"faWifi",
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
