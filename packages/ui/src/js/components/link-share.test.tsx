import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

import {setDocumentLanguage} from "../helpers/i18n";
import LinkShare from "./link-share";

afterEach(() => {
	cleanup();
	setDocumentLanguage("de");
});

describe("LinkShare", () => {
	it("labels the read-only URL field", () => {
		setDocumentLanguage("en");

		render(
			<LinkShare
				url="https://example.com/#pos"
				onFinished={undefined}
				onError={undefined}
			/>,
		);

		const input = screen.getByRole("textbox", {name: "Link to share"});
		expect((input as HTMLInputElement).value).toBe(
			"https://example.com/#pos",
		);
	});
});
