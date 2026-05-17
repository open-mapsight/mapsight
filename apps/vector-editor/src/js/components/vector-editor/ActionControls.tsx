import type EditorMixin from "@mapsight/core/mixins/EditorMixin";

import DeleteButton from "./DeleteButton.tsx";

export default function ActionControls({editor}: {editor: EditorMixin}) {
	return (
		<div className="ms3-vector-editor-mode-button-group">
			<DeleteButton editor={editor} />
		</div>
	);
}
