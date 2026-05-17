import type {PropsWithChildren} from "react";

import {makeReplaceableComponent} from "../../helpers/components";
import type {MapsightUiFeature} from "../../types";

export type Props = PropsWithChildren<{
	feature: MapsightUiFeature;
	html: string;
	text: string;
}>;

function TooltipContent({children}: Props) {
	return <>{children}</>;
}

export default makeReplaceableComponent("TooltipContent", TooltipContent);

declare module "../../helpers/components" {
	interface ComponentProps {
		TooltipContent: Props;
	}
}
