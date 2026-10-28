import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

import {ComponentsContext} from "../../helpers/components";
import {setDocumentLanguage} from "../../helpers/i18n";
import InfoOverlayLeft from "./info-overlay-left";
import Logo from "./logo";

afterEach(() => {
	cleanup();
	setDocumentLanguage("de");
});

function renderInfoOverlayLeft(components = {}) {
	const store = configureStore({
		reducer: () => ({app: {view: "desktop", isOverlayModalVisible: false}}),
	});
	return render(
		<Provider store={store}>
			<ComponentsContext.Provider value={components}>
				<InfoOverlayLeft />
			</ComponentsContext.Provider>
		</Provider>,
	);
}

describe("map overlay attribution mark", () => {
	it("links to open-mapsight.org with the German name by default", () => {
		render(<Logo />);
		const link = screen.getByRole("link", {name: "Erstellt mit Mapsight"});
		expect(link.getAttribute("href")).toBe("https://open-mapsight.org/");
		expect(link.getAttribute("rel")).toBe("external noreferrer noopener");
		expect(link.hasAttribute("target")).toBe(false);
		expect(link.className).toBe("ms3-logo ms3-logo--de");
	});

	it("follows the UI locale", () => {
		setDocumentLanguage("en");
		const {unmount} = render(<Logo />);
		expect(
			screen.getByRole("link", {name: "Built with Mapsight"}).className,
		).toBe("ms3-logo ms3-logo--en");
		unmount();

		setDocumentLanguage("en-GB");
		render(<Logo />);
		expect(
			screen.getByRole("link", {name: "Built with Mapsight"}).className,
		).toBe("ms3-logo ms3-logo--en");
	});

	it("uses the German mark for languages without their own artwork", () => {
		setDocumentLanguage("fr");
		render(<Logo />);
		expect(
			screen.getByRole("link", {name: "Erstellt mit Mapsight"}).className,
		).toBe("ms3-logo ms3-logo--de");
	});

	it("renders in the desktop map overlay", () => {
		renderInfoOverlayLeft();
		expect(
			screen.getByRole("link", {name: "Erstellt mit Mapsight"}),
		).toBeTruthy();
	});

	it("can be disabled or replaced by the host", () => {
		const {unmount} = renderInfoOverlayLeft({MapOverlayLogo: () => null});
		expect(screen.queryByRole("link")).toBeNull();
		unmount();

		renderInfoOverlayLeft({
			MapOverlayLogo: () => <a href="https://example.org/">Host</a>,
		});
		expect(
			screen.getByRole("link", {name: "Host"}).getAttribute("href"),
		).toBe("https://example.org/");
	});
});
