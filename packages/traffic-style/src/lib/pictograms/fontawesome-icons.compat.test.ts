import {expect, it} from "vitest";

/**
 * The Font Awesome pictogram importer depends on named exports from
 * @fortawesome/free-solid-svg-icons. Keep this list in sync with
 * scripts/dev/import-fontawesome.ts so major bumps cannot drop icons
 * we ship without failing CI.
 */
const requiredIcons = [
	"faBaby",
	"faBabyCarriage",
	"faBicycle",
	"faBiking",
	"faBolt",
	"faBoxesPacking",
	"faBridgeWater",
	"faBuilding",
	"faBus",
	"faCampground",
	"faCar",
	"faChair",
	"faChargingStation",
	"faCloudRain",
	"faCloudShowersWater",
	"faCloudSun",
	"faCloudSunRain",
	"faDog",
	"faDroplet",
	"faDumpster",
	"faFaucetDrip",
	"faFlagCheckered",
	"faGasPump",
	"faGlassWaterDroplet",
	"faHandHoldingDroplet",
	"faHeartCircleBolt",
	"faHippo",
	"faHospital",
	"faInfo",
	"faKey",
	"faLeaf",
	"faLocationDot",
	"faMugHot",
	"faPersonBiking",
	"faPersonShelter",
	"faPersonWalking",
	"faPlugCircleBolt",
	"faRecycle",
	"faRestroom",
	"faRoute",
	"faSchool",
	"faSeedling",
	"faShoePrints",
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
	"faWheelchair",
	"faWifi",
	"faWrench",
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
