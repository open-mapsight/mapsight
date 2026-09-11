/**
 * POST /purge body → urls for the product module's purge(urls?).
 * Omit urls or pass [] to clear the whole process cache.
 */

export type PurgeFn = (urls?: string[]) => string[] | Promise<string[]>;

export function parsePurgeUrls(raw: string): string[] | undefined {
	const trimmed = raw.trim();
	if (trimmed === "") {
		return undefined;
	}

	let body: unknown;
	try {
		body = JSON.parse(trimmed);
	} catch {
		throw Object.assign(new Error("invalid JSON"), {
			statusCode: 400,
			ssrCode: "VALIDATION" as const,
		});
	}

	if (body === null || typeof body !== "object" || Array.isArray(body)) {
		throw Object.assign(new Error("purge body must be a JSON object"), {
			statusCode: 400,
			ssrCode: "VALIDATION" as const,
		});
	}

	if (!("urls" in body) || body.urls === undefined) {
		return undefined;
	}

	if (!Array.isArray(body.urls)) {
		throw Object.assign(new Error("urls must be an array of strings"), {
			statusCode: 400,
			ssrCode: "VALIDATION" as const,
		});
	}

	const urls: string[] = [];
	for (const url of body.urls) {
		if (typeof url !== "string") {
			throw Object.assign(new Error("urls must be an array of strings"), {
				statusCode: 400,
				ssrCode: "VALIDATION" as const,
			});
		}
		const value = url.trim();
		if (value !== "") {
			urls.push(value);
		}
	}
	return urls;
}

export async function runPurge(
	purge: PurgeFn,
	urls: string[] | undefined,
): Promise<string[]> {
	const deleted = await purge(
		urls === undefined || urls.length === 0 ? undefined : urls,
	);
	return Array.isArray(deleted) ? deleted : [];
}
