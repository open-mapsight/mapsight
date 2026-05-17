import {forwardRef, memo} from "react";

import FeatureListEmptyMessage from "./empty-message";

const FeatureListContent = memo(
	forwardRef(function FeatureListContent(props, ref) {
		const {
			status,
			children,
			showFeatureListInfo: _showFeatureListInfo,
			as: T = "div",
			emptyAs,
			featureSourceId,
			...attributes
		} = props;
		let content = children;
		if (!content) {
			const hasSource =
				featureSourceId !== null &&
				featureSourceId !== undefined &&
				featureSourceId !== "";
			content = (
				<FeatureListEmptyMessage as={emptyAs} hasSource={hasSource} />
			);
		}

		const statusClass = status ? " ms3-list--status-" + status : "";
		return (
			<T
				ref={ref}
				className={`[ ms3-list ms3-list--features ${statusClass} ] ${
					attributes.className || ""
				}`}
				{...attributes}
			>
				{content}
			</T>
		);
	}),
);

export default FeatureListContent;
