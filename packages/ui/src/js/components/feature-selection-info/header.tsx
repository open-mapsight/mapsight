import {type ElementType, memo} from "react";

import {Heading, useHeadingElement} from "../../headings";
import {makeReplaceableComponent} from "../../helpers/components";
import getFeatureProperty from "../../helpers/get-feature-property";
import type {MapsightUiFeature} from "../../types";

export type Props = {
	feature: MapsightUiFeature;
	/** Forward to the headline so the details region can reference it. */
	id?: string;
	/** Explicit title element; omission follows the configured heading scope. */
	headlineAs?: ElementType;
};

const Header = memo(function FeatureSelectionInfoHeader({
	feature,
	id,
	headlineAs,
}: Props) {
	const name = getFeatureProperty(feature, "name") as string;
	const Headline = useHeadingElement("featureDetailsTitle", headlineAs);
	return (
		<div className="ms3-feature-selection-info__header">
			<Heading
				as={Headline}
				id={id}
				className="ms3-feature-selection-info__headline"
			>
				{name}
			</Heading>
		</div>
	);
});

export default makeReplaceableComponent("FeatureSelectionInfoHeader", Header);
export {Header as NonReplaceableHeader};

declare module "../../helpers/components" {
	interface ComponentProps {
		FeatureSelectionInfoHeader: Props;
	}
}
