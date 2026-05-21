import VectorEditorContext from "../../contexts/VectorEditor.ts";
import RedoButton from "./ConnectedRedoButton.tsx";
import UndoButton from "./ConnectedUndoButton.tsx";

//import ShowHistoryButton from './ShowHistoryButton';

function HistoryControls() {
	return (
		<VectorEditorContext.Consumer>
			{(editor) => {
				if (!editor) return null;

				return (
					<>
						<div className="ms3-vector-editor-mode-button-group">
							<UndoButton
								featureSource={editor.ids.featureSource!}
								className="ms3-vector-editor-button--grouped"
							/>
							{/* Not terribly helpful, so we do not use it for now: <ShowHistoryButton featureSource={editor.ids.featureSource} className="ms3-vector-editor-button--grouped" />*/}
							<RedoButton
								featureSource={editor.ids.featureSource!}
								className="ms3-vector-editor-button--grouped"
							/>
						</div>
					</>
				);
			}}
		</VectorEditorContext.Consumer>
	);
}

export default HistoryControls;
