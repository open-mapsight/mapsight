import {vi} from "vitest";

export function createMockFetch(
	handler: (url: string, init?: RequestInit) => unknown,
): typeof fetch {
	return vi.fn((input: string | URL | Request, init?: RequestInit) => {
		const url =
			typeof input === "string"
				? input
				: input instanceof URL
					? input.toString()
					: input.url;

		return Promise.resolve({
			ok: true,
			status: 200,
			headers: new Headers({"content-type": "application/json"}),
			json: () => handler(url, init),
		} as Response);
	});
}
