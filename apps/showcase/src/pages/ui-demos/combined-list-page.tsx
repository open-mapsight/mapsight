import {useState} from "react";

import App from "@mapsight/ui/components/app";
import type {CreateOptions} from "@mapsight/ui/types";

import {
	baseMapsightConfig,
	createOptions,
	styleFunction,
} from "../../combined-list/shared.tsx";
import {
	ReferenceMapCredits,
	ReferenceMapLayers,
} from "./combined-list-map-controls.tsx";
import {UiDemoShell} from "./ui-demo-shell.tsx";

import "./combined-list-reference.scss";

// This route's presentation is independent of the technical demos and host themes.
const referenceOptions: CreateOptions = {
	...createOptions,
	imagesUrl: "/img/",
	future: {v8_automaticHeadings: true},
	headings: {baseLevel: 2},
	components: {
		...createOptions.components,
		MapOverlayTopRight: ReferenceMapLayers,
		MapOverlayBottomLeft: ReferenceMapCredits,
	},
	uiState: {
		...createOptions.uiState,
		places: {
			center: {
				title: "Kartenmitte (Demo)",
				x: 10.5235749073,
				y: 52.2653825653,
			},
		},
		list: {
			...createOptions.uiState?.list,
			selectOnClick: true,
			stickyHeader: false,
		},
		layerSwitcher: {
			...createOptions.uiState?.layerSwitcher,
			external: {
				...createOptions.uiState?.layerSwitcher?.external,
				// Each theme toggles its layer and the combined list together.
				setFeatureSourceId: undefined,
			},
		},
	},
};

export function CombinedListPage() {
	const [theme, setTheme] = useState("auto");

	return (
		<section
			className="reference-demo"
			data-demo-theme={theme}
			aria-label="Karte und Liste – Referenzdemo"
		>
			<UiDemoShell
				baseMapsightConfig={baseMapsightConfig}
				createOptions={referenceOptions}
				styleFunction={styleFunction}
				introduction={
					<header className="reference-demo__intro">
						<div>
							<p className="reference-demo__eyebrow">
								Interaktive Referenz · Karte + Liste
							</p>
							<h1>Orte entdecken.</h1>
							<p className="reference-demo__description">
								Parks und Cafés in einer gemeinsamen Ansicht.
								Themen wählen, Liste durchsuchen und einen Ort
								auf der Karte öffnen.
							</p>
						</div>
						<label className="reference-demo__appearance">
							Darstellung dieser Demo
							<select
								value={theme}
								onChange={(event) =>
									setTheme(event.target.value)
								}
							>
								<option value="auto">Wie das System</option>
								<option value="light">Hell</option>
								<option value="dark">Dunkel</option>
							</select>
						</label>
						<p className="reference-demo__notice" role="note">
							<strong>6 fiktive Beispielorte.</strong> Die
							Listensuche arbeitet lokal. Keine Ortssuche oder
							Live-Daten.
						</p>
					</header>
				}
			>
				<App />
			</UiDemoShell>
		</section>
	);
}
