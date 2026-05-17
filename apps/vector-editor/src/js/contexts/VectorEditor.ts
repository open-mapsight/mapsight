import {createContext} from "react";

import type EditorMixin from "@mapsight/core/mixins/EditorMixin";

const VectorEditorContext = createContext<EditorMixin | null>(null);

export default VectorEditorContext;
