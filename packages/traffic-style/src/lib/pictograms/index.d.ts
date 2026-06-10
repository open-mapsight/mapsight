export type PictogramDefinition = {
	id: string;
	label?: Record<string, string>;
	/** SVG viewBox — supports "minX minY width height" for non-normalized glyphs. */
	viewBox: string;
	markup: string;
	source: "traffic-style" | "fontawesome";
	/** Extra inset inside the content slot (0–0.4). */
	padding?: number;
};
export declare const pictograms: PictogramDefinition[];
export declare function getPictogram(id: string): PictogramDefinition;
export declare function hasPictogram(id: string): boolean;
export declare function listPictogramIds(): string[];
export declare function listPictogramIdsBySource(
	source: PictogramDefinition["source"],
): string[];
//# sourceMappingURL=index.d.ts.map
