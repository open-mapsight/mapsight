import type {ForwardedRef} from "react";
import {forwardRef} from "react";

import type {PolymorphicProps} from "../polymorphic-props";

function FeatureListHeader(
	{as: T = "div", ...attributes}: PolymorphicProps,
	ref: ForwardedRef<HTMLElement>,
) {
	return <T className="ms3-list-header" ref={ref} {...attributes} />;
}

export default forwardRef(FeatureListHeader);
