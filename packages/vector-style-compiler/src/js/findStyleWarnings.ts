import type {Rules} from "./cssToRules.ts";
import type {
	DeclarationLeaf,
	DeclarationNode,
} from "./cssToRules/mapDeclaration.ts";

/** Roots whose properties only take effect when an `image-type` selects the symbol. */
const IMAGE_ROOTS = ["circle", "icon"] as const;

function isLeaf(
	node: DeclarationNode | DeclarationLeaf,
): node is DeclarationLeaf {
	return "value" in node;
}

function collectPropertyNames(
	node: DeclarationNode | DeclarationLeaf,
	path: string[],
	result: string[],
) {
	if (isLeaf(node)) {
		result.push(path.join("-"));
		return;
	}
	for (const [key, child] of Object.entries(node)) {
		collectPropertyNames(child, [...path, key], result);
	}
}

type GroupUsage = {
	/** Some rule of this style/group declares `image-type` (any value, any state or condition). */
	hasImageType: boolean;
	/** `circle-*` / `icon-*` properties declared by rules of this style/group. */
	imageProps: Set<string>;
};

/**
 * Finds styles that declare `circle-*` or `icon-*` properties without any
 * `image-type`. The runtime only builds a point symbol if `image-type` is
 * set, so such properties silently draw nothing.
 *
 * The check is deliberately conservative (a warning must never be a false
 * positive). Style groups (`.group`) are independent runtime styles and are
 * analyzed separately. Within a group, a named style `#s` can receive
 * `image-type` from
 *
 * - any rule selecting `#s` (regardless of state or attribute conditions), and
 * - any rule without a style selector (`*`, `:state`, `[attr]` and so on),
 *   because it applies to every style.
 *
 * If either declares `image-type` (including `none`), the style is not
 * reported. Style names that are not plain identifiers (a compound written
 * without whitespace, such as `#s:selected`, is read as one odd name) are
 * never reported. Properties of style-less rules are only reported if no rule of
 * the group declares `image-type` anywhere, since which named styles they
 * apply to cannot be decided statically. Values are never evaluated.
 */
export default function findStyleWarnings(rules: Rules["rules"]): string[] {
	// group -> style ("" = no style selector) -> usage
	const usage = new Map<string, Map<string, GroupUsage>>();

	for (const rule of rules) {
		for (const [group, declaration] of Object.entries(rule.declarations)) {
			const hasImageType = "type" in (declaration["image"] ?? {});
			const imageProps: string[] = [];
			for (const root of IMAGE_ROOTS) {
				const node = declaration[root];
				if (node) {
					collectPropertyNames(node, [root], imageProps);
				}
			}
			if (!hasImageType && imageProps.length === 0) {
				continue;
			}

			const styles = usage.get(group) ?? new Map<string, GroupUsage>();
			usage.set(group, styles);
			for (const condition of rule.conditions) {
				const key = condition.style ?? "";
				const entry = styles.get(key) ?? {
					hasImageType: false,
					imageProps: new Set<string>(),
				};
				styles.set(key, entry);
				entry.hasImageType ||= hasImageType;
				imageProps.forEach((prop) => entry.imageProps.add(prop));
			}
		}
	}

	const warnings: string[] = [];
	for (const [group, styles] of usage) {
		const global = styles.get("");
		const anyImageType = [...styles.values()].some((a) => a.hasImageType);
		const groupLabel = group === "default" ? "" : ` (group "${group}")`;

		for (const [style, entry] of styles) {
			if (
				entry.imageProps.size === 0 ||
				entry.hasImageType ||
				!/^[\w-]*$/.test(style)
			) {
				continue;
			}
			if (style === "" ? anyImageType : global?.hasImageType) {
				continue;
			}
			const name =
				style === "" ? "Style without #name" : `Style "${style}"`;
			warnings.push(
				`${name}${groupLabel} declares ${[...entry.imageProps].join(", ")} but no image-type, so no point symbol is drawn. Add e.g. "image-type: circle;" (or "icon") to the style.`,
			);
		}
	}
	return warnings;
}
