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

export async function load(
	state: XhrJsonLoaderState,
): Promise<FeatureSourceData | undefined> {
	if (!state.url) {
		await Promise.resolve();
		await Promise.reject("url missing");
		return;
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
	if (response.status !== 200) {
		await Promise.reject(response.statusText);
		return;
	}
	return (await response.json()) as FeatureSourceData | undefined;
}
