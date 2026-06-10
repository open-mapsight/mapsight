import type {IconVariant} from "./icon-id.ts";
import type {RequiredIconColors} from "./resolve.ts";

export type ContentSlot = {
	x: number;
	y: number;
	size: number;
};
export type TemplateDefinition = {
	width: number;
	height: number;
	viewBox: string;
	contentSlot: ContentSlot;
	textAnchor: {
		x: number;
		y: number;
	};
	fontSize: number;
	renderBackground: (colors: RequiredIconColors) => string;
};
export declare function getTemplate(variant: IconVariant): TemplateDefinition;
//# sourceMappingURL=templates.d.ts.map
