/**
 * Wizard date-range queries. The raw-values contract defaults to `limit=50`
 * and `order=desc`; omitting those truncates the selected window and draws
 * the chart newest-first.
 */
export const RAW_VALUES_RANGE_QUERY = {
	limit: 500,
	order: "asc",
} as const;
