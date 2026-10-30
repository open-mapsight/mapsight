import {combineArtwork} from "./definition.ts";
import type {SignArtwork} from "./definition.ts";
import * as bases from "./frames.ts";
import * as symbols from "./symbols.ts";

export const signs: Record<string, SignArtwork> = {
	ampel: combineArtwork(bases.warningTriangle, symbols.ampel),
	baustelle: combineArtwork(bases.warningTriangle, symbols.baustelle),
	fahrbahnverengung: combineArtwork(
		bases.warningTriangle,
		symbols.fahrbahnverengung,
	),
	gegenverkehr: combineArtwork(bases.warningTriangle, symbols.gegenverkehr),
	meldung: combineArtwork(bases.warningTriangle, symbols.meldung),
	stau: combineArtwork(bases.warningTriangle, symbols.stau),
	hoehenbeschraenkung: combineArtwork(
		bases.restrictionCircle,
		symbols.hoehenbeschraenkung,
	),
	lkwsperrung: combineArtwork(bases.restrictionCircle, symbols.lkwsperrung),
	tonnage: combineArtwork(bases.restrictionCircle, symbols.tonnage),
	vollsperrung: bases.restrictionCircle,
	parkflaeche: combineArtwork(bases.parkingBase, symbols.parkflaeche),
	behindertenparken: combineArtwork(
		bases.parkingBase,
		symbols.behindertenparken,
	),
	busparkplatz: combineArtwork(bases.parkingBase, symbols.busparkplatz),
	cam: combineArtwork(bases.parkingBase, symbols.cam),
	motorradstellplatz: combineArtwork(
		bases.parkingBase,
		symbols.motorradstellplatz,
	),
	parkhaus: combineArtwork(bases.parkingBase, symbols.parkhaus),
	pundr: combineArtwork(bases.parkingBase, symbols.pundr),
	tiefgarage: combineArtwork(bases.parkingBase, symbols.tiefgarage),
	einbahnstrasse: combineArtwork(bases.filledCircle, symbols.einbahnstrasse),
	umleitung: combineArtwork(bases.detourBase, symbols.umleitung),
	breitenbeschraenkung: combineArtwork(
		bases.horizontalRestrictionCircle,
		symbols.breitenbeschraenkung,
	),
};
