export type NearestAddressHit = {
	name?: string;
	nummer?: string | number;
	zusatz?: string;
	plz?: string | number;
	ort?: string;
	distance?: number | string;
};

export type FormattedNearestAddress = {
	name: string;
	listInformation: string | null;
};

function trimPart(value: unknown): string | null {
	if (typeof value === "number" && Number.isFinite(value)) {
		return String(value);
	}
	if (typeof value !== "string") {
		return null;
	}
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

export function formatNearestAddress(
	hit: NearestAddressHit | null | undefined,
): FormattedNearestAddress | null {
	if (!hit || typeof hit !== "object") {
		return null;
	}
	const street = trimPart(hit.name);
	if (!street) {
		return null;
	}
	const name = [street, trimPart(hit.nummer), trimPart(hit.zusatz)]
		.filter((part): part is string => part != null)
		.join(" ");
	const listInformation = [trimPart(hit.plz), trimPart(hit.ort)]
		.filter((part): part is string => part != null)
		.join(" ");
	return {
		name,
		listInformation: listInformation.length > 0 ? listInformation : null,
	};
}

export function nearestAddressUrl(
	baseUrl: string,
	lat: number,
	lon: number,
): string {
	const url = new URL(baseUrl, "https://mapsight.invalid");
	url.searchParams.set("lat", String(lat));
	url.searchParams.set("lon", String(lon));
	if (/^https:\/\/mapsight\.invalid\//.test(url.href)) {
		return `${url.pathname}${url.search}`;
	}
	return url.href;
}

export async function fetchNearestAddress(
	baseUrl: string,
	lat: number,
	lon: number,
	signal?: AbortSignal,
): Promise<FormattedNearestAddress | null> {
	const response = await fetch(nearestAddressUrl(baseUrl, lat, lon), {
		signal,
		headers: {Accept: "application/json"},
	});
	if (!response.ok) {
		return null;
	}
	const data: unknown = await response.json();
	if (!Array.isArray(data) || data.length === 0) {
		return null;
	}
	return formatNearestAddress(data[0] as NearestAddressHit);
}
