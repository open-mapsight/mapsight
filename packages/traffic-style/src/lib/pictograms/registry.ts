import type {PictogramDefinition, PictogramSource} from "./types.ts";

const byId = new Map<string, PictogramDefinition>();

export function registerPictograms(
	pictograms: readonly PictogramDefinition[],
): void {
	for (const pictogram of pictograms) {
		byId.set(pictogram.id, pictogram);
	}
}

export function getPictogram(id: string): PictogramDefinition {
	const pictogram = byId.get(id);
	if (!pictogram) {
		throw new Error(`Unknown pictogram: ${id}`);
	}
	return pictogram;
}

export function hasPictogram(id: string): boolean {
	return byId.has(id);
}

export function listPictogramIds(): string[] {
	return [...byId.keys()].sort();
}

export function listPictogramIdsBySource(source: PictogramSource): string[] {
	return [...byId.values()]
		.filter((pictogram) => pictogram.source === source)
		.map((pictogram) => pictogram.id)
		.sort();
}

export function getPictograms(): PictogramDefinition[] {
	return [...byId.values()];
}
