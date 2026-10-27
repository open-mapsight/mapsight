import {memo} from "react";

import {makeReplaceableComponent} from "../../helpers/components";
import getFeatureProperty from "../../helpers/get-feature-property";
import type {MapsightUiFeature} from "../../types";

export type Props = {
	feature: MapsightUiFeature;
	/** Forward to the headline so the details region can reference it. */
	id?: string;
};

const Header = memo(function FeatureSelectionInfoHeader({feature, id}: Props) {
	const name = getFeatureProperty(feature, "name") as string;
	return (
		<header className="ms3-feature-selection-info__header">
			<h3 id={id} className="ms3-feature-selection-info__headline">
				{name}
			</h3>
		</header>
	);
});

export default makeReplaceableComponent("FeatureSelectionInfoHeader", Header);
export {Header as NonReplaceableHeader};

declare module "../../helpers/components" {
	interface ComponentProps {
		FeatureSelectionInfoHeader: Props;
	}
}
