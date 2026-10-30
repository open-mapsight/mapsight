import {renderIconBitmap} from "@mapsight/traffic-style/icon";
import {afterEach, expect, it, vi} from "vitest";

afterEach(() => vi.restoreAllMocks());

it.each([
	["default", 64, 40],
	["small", 41, 28],
	["xsmall", 31, 22],
	["plain", 54, 34],
] as const)(
	"rasterizes both dimensions at pixelRatio 2 for %s",
	async (variant, logicalWidth, logicalHeight) => {
		const drawImage = vi.fn();
		vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
			drawImage,
		} as unknown as CanvasRenderingContext2D);
		vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
			"data:image/png;base64,test",
		);
		vi.stubGlobal(
			"Image",
			class {
				onload?: () => void;
				set src(_src: string) {
					queueMicrotask(() => this.onload?.());
				}
			},
		);
		vi.stubGlobal(
			"URL",
			class extends URL {
				static override createObjectURL = vi.fn(() => "blob:test");
				static override revokeObjectURL = vi.fn();
			},
		);
		try {
			const bitmap = await renderIconBitmap({
				pictogram: "toilet-accessible",
				variant,
			});
			expect(bitmap).toMatchObject({
				logicalWidth,
				logicalHeight,
				width: logicalWidth * 2,
				height: logicalHeight * 2,
				pixelRatio: 2,
			});
			expect(drawImage).toHaveBeenCalledWith(
				expect.anything(),
				0,
				0,
				logicalWidth * 2,
				logicalHeight * 2,
			);
			expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
		} finally {
			vi.unstubAllGlobals();
		}
	},
);
