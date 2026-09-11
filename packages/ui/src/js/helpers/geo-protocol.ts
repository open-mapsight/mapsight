export type GeoProtocolSupportEnv = {
	userAgent?: string;
	/** Chromium Client Hint; `null` when the browser does not expose it. */
	mobile?: boolean | null;
};

type BrowserNavigator = {
	userAgent?: string;
	userAgentData?: {mobile?: boolean};
};

export function readGeoProtocolSupportEnv(
	nav: BrowserNavigator | undefined = typeof window === "undefined"
		? undefined
		: window.navigator,
): GeoProtocolSupportEnv {
	if (!nav) {
		return {};
	}

	const mobile = nav.userAgentData?.mobile;
	return {
		userAgent: nav.userAgent,
		mobile: typeof mobile === "boolean" ? mobile : null,
	};
}

/**
 * Whether this client is likely to handle `geo:` (default maps app).
 *
 * There is no protocol-handler feature API. Prefer `navigator.userAgentData.mobile`
 * when present; otherwise match common mobile UA tokens. Desktop browsers usually
 * have no handler and would show a dead control.
 */
export function supportsGeoProtocol(
	env: GeoProtocolSupportEnv = readGeoProtocolSupportEnv(),
): boolean {
	if (env.mobile === true) {
		return true;
	}
	if (env.mobile === false) {
		return false;
	}
	return /Android|iPhone|iPad|iPod/i.test(env.userAgent ?? "");
}
