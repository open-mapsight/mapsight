/** Google Maps “Copy coordinates”: lat, lon, six decimals, comma-space. */
export function formatLonLat(lat: number, lon: number): string {
	return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

function dmsPart(value: number): {deg: number; min: number; sec: number} {
	const abs = Math.abs(value);
	let deg = Math.floor(abs);
	const minutesTotal = (abs - deg) * 60;
	let min = Math.floor(minutesTotal);
	let sec = Math.round((minutesTotal - min) * 600) / 10;
	if (sec >= 60) {
		sec = 0;
		min += 1;
	}
	if (min >= 60) {
		min = 0;
		deg += 1;
	}
	return {deg, min, sec};
}

function formatDms(value: number, positive: string, negative: string): string {
	const {deg, min, sec} = dmsPart(value);
	const hemi = value >= 0 ? positive : negative;
	return `${deg}° ${min}′ ${sec.toFixed(1)}″ ${hemi}`;
}

export type CoordinateSpellings = {
	decimal: string;
	decimalDegrees: string;
	dms: string;
	text: string;
};

/** Display spellings plus `text` for the clipboard (Google Maps decimal). */
export function formatCoordinateSpellings(
	lat: number,
	lon: number,
): CoordinateSpellings {
	const decimal = formatLonLat(lat, lon);
	const latHemi = lat >= 0 ? "N" : "S";
	const lonHemi = lon >= 0 ? "E" : "W";
	const decimalDegrees = `${Math.abs(lat).toFixed(5)}° ${latHemi}, ${Math.abs(lon).toFixed(5)}° ${lonHemi}`;
	const dms = `${formatDms(lat, "N", "S")}, ${formatDms(lon, "E", "W")}`;
	return {
		decimal,
		decimalDegrees,
		dms,
		text: decimal,
	};
}
