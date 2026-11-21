export type DatasetId =
	"mixed-geometries" | "rich-properties" | "small-properties";

export type DatasetSpec = {
	descriptionLength: number;
	featureCount: number;
	id: DatasetId;
};

export type GeoJsonFeature = {
	geometry?: unknown;
	id?: string | number;
	properties?: Record<string, unknown> | null;
	type?: string;
};

export type GeoJsonCollection = {
	features?: GeoJsonFeature[];
	type?: string;
};

export const DATASETS: DatasetSpec[] = [
	{id: "small-properties", featureCount: 1000, descriptionLength: 32},
	{id: "rich-properties", featureCount: 500, descriptionLength: 4096},
	{id: "mixed-geometries", featureCount: 500, descriptionLength: 512},
];

/** Deterministic, entirely synthetic workloads; no network or production data. */
export function createDataset(spec: DatasetSpec): GeoJsonCollection {
	return {
		type: "FeatureCollection",
		features: Array.from({length: spec.featureCount}, (_, index) => {
			const id = `${spec.id}-${index}`;
			const x = (index % 100) / 100;
			const y = Math.floor(index / 100) / 100;
			const geometry =
				spec.id === "mixed-geometries" && index % 2 === 0
					? {
							type: "LineString",
							coordinates: [
								[x, y],
								[x + 0.001, y + 0.001],
							],
						}
					: {type: "Point", coordinates: [x, y]};
			return {
				type: "Feature",
				id,
				geometry,
				properties: {
					id,
					name: `Synthetic feature ${index}`,
					markerCaption: String(index % 100),
					mapsightIconId: "circle",
					state: index % 3 === 0 ? "active" : "idle",
					description: "Synthetic benchmark detail. ".repeat(
						Math.ceil(spec.descriptionLength / 28),
					),
					tagGroups: {category: [`group-${index % 5}`]},
					metadata: {ordinal: index, flags: [true, false]},
				},
			};
		}),
	};
}

/** Union FeatureCollection of the given synthetic datasets (all by default). */
export function createUnionCollection(filterIds?: ReadonlySet<string>): {
	loaded: Array<{collection: GeoJsonCollection; id: DatasetId}>;
	union: GeoJsonCollection;
} {
	const specs = filterIds?.size
		? DATASETS.filter((spec) => filterIds.has(spec.id))
		: DATASETS;
	const loaded = specs.map((spec) => ({
		collection: createDataset(spec),
		id: spec.id,
	}));

	return {
		loaded,
		union: {
			features: loaded.flatMap(
				({collection}) => collection.features ?? [],
			),
			type: "FeatureCollection",
		},
	};
}
