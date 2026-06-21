import type {FeatureSourceData} from "@/lib/feature-sources/types";

export type XhrJsonLoaderState = {
	url?: string;
};

const locationBaseUrl = (() => {
	if (typeof window === "undefined" || !window.location) {
		return undefined;
	}
	return window.location.href;
})();

function createHttpError(status: number, statusText: string) {
	const detail = statusText.trim();
	return new Error(detail ? `HTTP ${status} ${detail}` : `HTTP ${status}`);
}

export async function load(
	state: XhrJsonLoaderState,
): Promise<FeatureSourceData | undefined> {
	if (!state.url) {
		throw new Error("url missing");
	}

	const url = new URL(
		state.url,
		(typeof global !== "undefined" &&
			"baseUrl" in global &&
			typeof global.baseUrl === "string" &&
			global.baseUrl) ||
			locationBaseUrl ||
			"http://localhost/",
	);

	const response = await fetch(url.href, {redirect: "follow"});
	if (!response.ok) {
		throw createHttpError(response.status, response.statusText);
	}
	return (await response.json()) as FeatureSourceData | undefined;
}
