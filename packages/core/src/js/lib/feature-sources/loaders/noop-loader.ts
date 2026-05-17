import type {FeatureSourceData} from "@/lib/feature-sources/types";

export type NoopLoaderState = {
	data?: FeatureSourceData | null;
};

export async function load(
	state: NoopLoaderState,
): Promise<FeatureSourceData | undefined> {
	if (state.data?.features) {
		return Promise.resolve(state.data);
	}

	await Promise.resolve();
	await Promise.reject("no data");
}
