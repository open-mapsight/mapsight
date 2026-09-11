/**
 * SSR API v1 types (erasable). POST /v1/render → { v, html, state, pageMeta, meta }.
 */
import type {PlacePageMeta, SsrRequestBody} from "./render.ts";

export type SsrV1ErrorCode =
	"VALIDATION" | "BODY_TOO_LARGE" | "RENDER_FAILED" | "RENDER_TIMEOUT";

export type SsrV1Success = {
	v: 1;
	html: string;
	state: unknown;
	pageMeta: PlacePageMeta | null;
	meta: {
		preset?: string;
		renderMs: number;
		requestId?: string;
		assetVersion?: string;
	};
};

export type SsrV1Error = {
	v: 1;
	error: {
		code: SsrV1ErrorCode;
		message: string;
	};
};

export type SsrRenderResult =
	| string
	| {
			html: string;
			state: unknown;
	  };

export function normalizeRenderResult(
	result: SsrRenderResult,
	body: SsrRequestBody,
): {html: string; state: unknown} {
	if (result && typeof result === "object" && "html" in result) {
		const html = result.html;
		if (typeof html !== "string" || html === "") {
			throw Object.assign(new Error("render() html missing"), {
				statusCode: 500,
				ssrCode: "RENDER_FAILED" as const,
			});
		}
		return {html, state: result.state};
	}
	if (typeof result !== "string" || result === "") {
		throw Object.assign(new Error("render() returned empty"), {
			statusCode: 500,
			ssrCode: "RENDER_FAILED" as const,
		});
	}
	return {
		html: result,
		state: extractStateFromFragment(result) ?? {
			app: {ssr: "fragment", preset: body.preset ?? null},
		},
	};
}

export function extractStateFromFragment(html: string): unknown {
	const match = html.match(/data-dehydrated-state=(?:"([^"]*)"|'([^']*)')/);
	if (!match) {
		return null;
	}
	const raw = match[1] ?? match[2];
	if (raw === undefined) {
		return null;
	}
	try {
		return JSON.parse(decodeHtmlAttr(raw));
	} catch {
		return null;
	}
}

function decodeHtmlAttr(value: string): string {
	return value
		.replace(/&quot;/g, '"')
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&");
}
