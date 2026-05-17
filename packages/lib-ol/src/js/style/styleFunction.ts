import type {FeatureLike} from "ol/Feature";
import type Style from "ol/style/Style";

import type {StyleFunctionOptions} from "./createCachedStyleFunction";

export const STYLE_ENV_FIELD_NAME = "style";

// TODO: I dont really like this (here). Can we find a better way of
//    defining the style function props/env?
type StatePrimitive = string | number | boolean | null | undefined;
type StateObject = {[key: string]: StateValue};
type StateArray = StateValue[];
type StateValue = StatePrimitive | StateObject | StateArray;

export type MapsightStyleFunctionEnv = {
	[k: string]: StateValue;
	[STYLE_ENV_FIELD_NAME]?: string;
};
export type MapsightStyleFunctionProps = {
	[k: string]: StateValue;
};

export type MapsightStyleFunction = (
	env: MapsightStyleFunctionEnv,
	feature: FeatureLike,
) => Array<Style> | Style | undefined;

export const createPropsFilter = (
	allowedProps: StyleFunctionOptions["allowedProps"] = [],
) =>
	allowedProps === false
		? (props: MapsightStyleFunctionProps) => props
		: function filterProps(props: MapsightStyleFunctionProps) {
				const filteredProps: MapsightStyleFunctionProps = {};
				allowedProps
					.filter((key) => props[key])
					.forEach((key) => {
						filteredProps[key] = props[key];
					});

				return filteredProps;
			};
