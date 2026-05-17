import {useSelector} from "react-redux";

import {createFilteredFeatureSourceSelector} from "@mapsight/core/lib/feature-sources/selectors";
import type EditorMixin from "@mapsight/core/mixins/EditorMixin";

import FeatureListItem from "./FeatureListItem.tsx";

function FeatureList({editor}: {editor: EditorMixin}) {
	const data = useSelector(
		createFilteredFeatureSourceSelector(
			editor.controllers.featureSources!,
			editor.ids.featureSource!,
		),
	)?.data;

	let i = 0;
	return (
		<ul className={"ms3-vector-editor-feature-list"}>
			{data?.features?.map((feature) => (
				<FeatureListItem
					key={feature.id}
					editor={editor}
					as="li"
					index={++i}
					feature={feature}
				/>
			)) || <p>Keine Features</p>}
		</ul>
	);
}

export default FeatureList;
