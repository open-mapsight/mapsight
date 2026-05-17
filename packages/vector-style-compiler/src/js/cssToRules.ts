import type css from "css";
import {parse} from "css";

import unique from "@mapsight/lib-js/array/unique";

import mapRule from "./cssToRules/mapRule.ts";

type Meta = Record<string, unknown>;

const collectMeta = <
	TMeta extends Meta,
	TMetaKey extends keyof TMeta = keyof Meta,
>(
	vals: Array<{__meta: TMeta}>,
	key: TMetaKey,
) => {
	const values = vals.map((v) => v.__meta[key]).flat();

	return unique(values);
};

function isRule(val: css.Rule | css.Comment | css.AtRule): val is css.Rule {
	return val.type === "rule";
}

// types: rule,
// ignored types: media, stylesheet, comment, charset, custom-media, document, font-face,
//                import, keyframes, keyframe, media, namespace, page, supports
function cssOmToRules(om: css.Stylesheet) {
	return om.stylesheet?.rules.filter(isRule).flatMap(mapRule) ?? [];
}

export type Rules = ReturnType<typeof cssToRules>;

export default function cssToRules(content: string) {
	const om = parse(content);
	const rules = cssOmToRules(om);
	return {
		rules,
		__meta: {
			styleNames: collectMeta(rules, "styleNames"),
			stateNames: collectMeta(rules, "stateNames"),
			groupNames: collectMeta(rules, "groupNames"),
			declarationNames: collectMeta(rules, "declarationNames"),
			styleProps: collectMeta(rules, "styleProps"),
			stylePropExpressions: collectMeta(rules, "stylePropExpressions"),
		},
	};
}
