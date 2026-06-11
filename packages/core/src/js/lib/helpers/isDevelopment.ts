export function isDevelopment(): boolean {
	if (typeof process !== "undefined" && process.env.NODE_ENV) {
		return process.env.NODE_ENV === "development";
	}

	if (typeof import.meta !== "undefined") {
		const env = (import.meta as ImportMeta & {env?: {DEV?: boolean}}).env;
		return env?.DEV === true;
	}

	return false;
}
