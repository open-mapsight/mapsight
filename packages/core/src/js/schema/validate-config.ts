import type {ZodError, ZodType, z} from "zod";

import {isDevelopment} from "@/lib/helpers/isDevelopment";

export function formatZodError(error: ZodError, context?: string): string {
	const prefix = context ? `[${context}] ` : "";
	const messages = error.issues.map((issue) => {
		const path =
			issue.path.length > 0 ? issue.path.map(String).join(".") : "(root)";
		return `${path}: ${issue.message}`;
	});
	return `${prefix}${messages.join("; ")}`;
}

export function validateConfig<T extends ZodType>(
	schema: T,
	config: unknown,
	options?: {strict?: boolean; context?: string},
): z.infer<T> {
	const result = schema.safeParse(config);

	if (!result.success) {
		const msg = formatZodError(result.error, options?.context);
		if (isDevelopment()) {
			console.warn("[mapsight] Config validation failed:", msg);
		} else if (options?.strict) {
			throw new Error(msg);
		}
		return config as z.infer<T>;
	}

	return result.data;
}
