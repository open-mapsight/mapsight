export const hasGeolocationSupport = (() => {
	// eslint-disable-next-line n/no-unsupported-features/node-builtins
	if (typeof window === "undefined" || !("geolocation" in navigator)) {
		return false;
	}

	return (
		location.protocol === "https:" ||
		location.hostname === "localhost" ||
		location.hostname.endsWith(".localhost") ||
		location.hostname === "127.0.0.1"
	);
})();
