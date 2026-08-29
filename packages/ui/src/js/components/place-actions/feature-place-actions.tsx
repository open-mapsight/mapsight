import type {ReactElement} from "react";

import type {MapsightUiFeature} from "../../types";
import PlaceActions from "./place-actions";
import type {PlaceActionsConfig} from "./types";

export type FeaturePlaceActionsProps = {
	feature: MapsightUiFeature;
	config?: PlaceActionsConfig;
	className?: string;
};

/** Default composition: share, navigate, website, call. */
export default function FeaturePlaceActions({
	feature,
	config,
	className,
}: FeaturePlaceActionsProps): ReactElement | null {
	return (
		<PlaceActions.Root
			feature={feature}
			config={config}
			className={className}
		>
			<PlaceActions.Share />
			<PlaceActions.Navigate />
			<PlaceActions.Website />
			<PlaceActions.Call />
		</PlaceActions.Root>
	);
}

declare module "../../helpers/components" {
	interface ComponentProps {
		FeaturePlaceActions: FeaturePlaceActionsProps;
	}
}
