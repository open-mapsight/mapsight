export const VOLATILE_CALC_HELPERS = ["mapsightRuntimeIcon"] as const;

export function containsVolatileCalcHelper(expression: string): boolean {
	return VOLATILE_CALC_HELPERS.some((helper) => expression.includes(helper));
}
