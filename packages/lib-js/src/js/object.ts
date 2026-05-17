export function isRecord(val: unknown): val is Record<PropertyKey, unknown> {
	return val !== null && typeof val === "object" && !Array.isArray(val);
}
