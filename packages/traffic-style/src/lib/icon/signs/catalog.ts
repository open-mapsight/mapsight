import {
	signBases as bases,
	signGlyphs as symbols,
} from "../../../generated/sign-artwork.ts";
import {combineArtwork} from "./definition.ts";
import type {SignArtwork} from "./definition.ts";

export const signs: Record<string, SignArtwork> = {
	ampel: combineArtwork(bases["warning-triangle"], symbols.ampel),
	baustelle: combineArtwork(bases["warning-triangle"], symbols.baustelle),
	fahrbahnverengung: combineArtwork(
		bases["warning-triangle"],
		symbols.fahrbahnverengung,
	),
	gegenverkehr: combineArtwork(
		bases["warning-triangle"],
		symbols.gegenverkehr,
	),
	meldung: combineArtwork(bases["warning-triangle"], symbols.meldung),
	stau: combineArtwork(bases["warning-triangle"], symbols.stau),
	hoehenbeschraenkung: combineArtwork(
		bases["restriction-circle"],
		symbols.hoehenbeschraenkung,
	),
	lkwsperrung: combineArtwork(
		bases["restriction-circle"],
		symbols.lkwsperrung,
	),
	tonnage: combineArtwork(bases["restriction-circle"], symbols.tonnage),
	vollsperrung: bases["restriction-circle"],
	parkflaeche: combineArtwork(bases["parking-base"], symbols.parkflaeche),
	behindertenparken: combineArtwork(
		bases["parking-base"],
		symbols.behindertenparken,
	),
	busparkplatz: combineArtwork(bases["parking-base"], symbols.busparkplatz),
	cam: combineArtwork(bases["parking-base"], symbols.cam),
	motorradstellplatz: combineArtwork(
		bases["parking-base"],
		symbols.motorradstellplatz,
	),
	parkhaus: combineArtwork(bases["parking-base"], symbols.parkhaus),
	pundr: combineArtwork(bases["parking-base"], symbols.pundr),
	tiefgarage: combineArtwork(bases["parking-base"], symbols.tiefgarage),
	einbahnstrasse: combineArtwork(
		bases["filled-circle"],
		symbols.einbahnstrasse,
	),
	umleitung: combineArtwork(bases["detour-base"], symbols.umleitung),
	breitenbeschraenkung: combineArtwork(
		bases["horizontal-restriction-circle"],
		symbols.breitenbeschraenkung,
	),
};
