import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {setDocumentLanguage} from "../../helpers/i18n";
import MapOverlayArea from "./area";

afterEach(cleanup);

function Boom() {
	throw new Error("overlay boom");
}

describe("MapOverlayArea", () => {
	it("keeps the area mounted when a child throws", () => {
		setDocumentLanguage("en");
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		render(
			<div>
				<span>map still here</span>
				<MapOverlayArea position="top-right">
					<Boom />
				</MapOverlayArea>
			</div>,
		);

		expect(screen.getByText("map still here")).toBeTruthy();
		expect(screen.getByRole("alert").className).toContain(
			"ms3-error-boundary--overlay",
		);

		consoleError.mockRestore();
	});
});
