import {renderToString} from "react-dom/server";
import ReactModal from "react-modal";

import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, expect, it} from "vitest";

import {setDocumentLanguage, translate} from "../../helpers/i18n";
import {create} from "../../index";
import type {MapsightUiRendererProps} from "../../types";
import App from "../app";
import AppContext from "../helping/app-context";

afterEach(cleanup);

it("opens registered pictogram credits in a list-only app with server-renderable markup", () => {
	setDocumentLanguage("en");
	const context = create(
		null,
		() => undefined,
		{},
		{
			validateConfig: false,
			citationPictogramIds: ["fa-school"],
			uiState: {
				view: "desktop",
				map: {show: false},
				list: {show: true},
			},
			renderer: (_container, props) => props,
		},
	);
	const props = context.render?.({}) as MapsightUiRendererProps;
	const tree = (
		<AppContext {...props}>
			<App />
		</AppContext>
	);
	const html = renderToString(tree);
	expect(html).toContain(translate("ui.map-overlay.info.open"));

	const host = document.createElement("div");
	document.body.appendChild(host);
	ReactModal.setAppElement(host);
	render(tree, {container: host});
	fireEvent.click(
		screen.getByRole("button", {
			name: translate("ui.map-overlay.info.open"),
		}),
	);
	expect(screen.getByRole("dialog")).toBeTruthy();
	expect(screen.getByRole("link", {name: "Font Awesome"})).toBeTruthy();
	expect(screen.getByRole("link", {name: "CC BY 4.0"})).toBeTruthy();
});
