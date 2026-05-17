import {useEffect, useState} from "react";

import type {Feature} from "ol";

import {selectExclusively} from "@mapsight/core/lib/feature-selections/actions";
import type {MapController} from "@mapsight/core/lib/map/controller";
import type EditorMixin from "@mapsight/core/mixins/EditorMixin";
import {EDITOR_MODE} from "@mapsight/core/mixins/EditorMixin";

import ModeButton from "./ModeButton.tsx";

export default function ModeControls({editor}: {editor: EditorMixin}) {
	const initialMode = EDITOR_MODE.TRANSLATE;
	const [mode, setMode] = useState<string | null>(initialMode);

	// Set initial mode
	useEffect(() => {
		editor.store.dispatch(editor.actions.setMode!(mode));
	}, [editor.actions.setMode, editor.store, mode]);

	// Reset mode after draw
	useEffect(
		function () {
			const mapController = editor.store.getController(
				editor.controllers.map!,
			) as MapController;
			const eventName = `interaction.${editor.ids.drawInteraction}.drawend`;
			const listener = ({feature}: {feature: Feature}) => {
				setMode(EDITOR_MODE.TRANSLATE);

				// NOTE: Weird hack because the openlayers draw interaction has triggered a click event on drawend and
				// will dispatch actions to deselect all features on the next tick. so we have to delay as well.
				setTimeout(() => {
					// select (exclusively) the feature we just drew
					editor.store.dispatch(
						selectExclusively(
							editor.controllers.featureSelections!,
							"select",
							String(feature.getId()),
						),
					);
				}, 10);
			};

			mapController.on(eventName, listener);

			return () => {
				mapController.off(eventName, listener);
			};
		},
		[editor, setMode],
	);

	return (
		<div className="ms3-vector-editor-mode-button-group">
			{/*<ModeButton.Navigate currentMode={mode} setMode={setEditorMode}>Bewegen</ModeButton.Navigate>*/}

			{/*<ModeButton.Select currentMode={mode} setMode={setEditorMode} className="ms3-vector-editor-button--grouped">
				<Icon name="icon-cursor" />
				<VisuallyHidden>Auswählen/Bewegen</VisuallyHidden>
			</ModeButton.Select>*/}

			<ModeButton.Translate
				currentMode={mode}
				setMode={setMode}
				className="ms3-vector-editor-button--grouped"
				icon="icon-cursor"
				label="Auswählen/Bewegen/Verschieben"
			/>

			<ModeButton.Modify
				currentMode={mode}
				setMode={setMode}
				className="ms3-vector-editor-button--grouped"
				icon="icon-wrench"
				label="Bearbeiten"
			/>

			<ModeButton.DrawPoint
				currentMode={mode}
				setMode={setMode}
				className="ms3-vector-editor-button--grouped"
				icon="icon-point"
				label="Punkt"
			/>

			<ModeButton.DrawLineString
				currentMode={mode}
				setMode={setMode}
				className="ms3-vector-editor-button--grouped"
				icon="icon-line"
				label="(Poly-)Linie"
			/>

			<ModeButton.DrawPolygon
				currentMode={mode}
				setMode={setMode}
				className="ms3-vector-editor-button--grouped"
				icon="icon-area"
				label="Fläche"
			/>
		</div>
	);
}
