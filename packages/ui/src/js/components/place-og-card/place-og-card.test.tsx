import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

import PlaceOgCard, {PLACE_OG_CARD_VERSION} from "./place-og-card";

afterEach(() => {
	cleanup();
});

describe("PlaceOgCard", () => {
	it("renders a generic wordmark and the feature title", () => {
		render(<PlaceOgCard title="Rathaus" />);

		expect(screen.getByText("Map")).toBeTruthy();
		expect(screen.getByText("Rathaus")).toBeTruthy();
	});

	it("lets the host replace the wordmark", () => {
		render(<PlaceOgCard title="Park" wordmark="City plan" />);

		expect(screen.getByText("City plan")).toBeTruthy();
		expect(screen.queryByText("Map")).toBeNull();
	});

	it("exposes a card version for cache keys", () => {
		expect(PLACE_OG_CARD_VERSION).toBe(1);
	});
});
