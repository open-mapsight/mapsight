import type {ElementType, ForwardedRef} from "react";
import {forwardRef, memo} from "react";

import type {PolymorphicProps} from "../polymorphic-props";
import FeatureListEmptyMessage from "./empty-message";

export type FeatureListContentProps = PolymorphicProps & {
	status?: string;
	showFeatureListInfo?: boolean;
	emptyAs?: ElementType;
	featureSourceId?: string | null;
};

const FeatureListContent = memo(
	forwardRef(function FeatureListContent(
		props: FeatureListContentProps,
		ref: ForwardedRef<HTMLElement>,
	) {
		const {
			status,
			children,
			showFeatureListInfo: _showFeatureListInfo,
			as: T = "ul",
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
				<FeatureListEmptyMessage
					as={emptyAs || (T === "ul" || T === "ol" ? "li" : "div")}
					hasSource={hasSource}
				/>
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
