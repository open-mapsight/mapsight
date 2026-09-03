export function announceStatus(message: string): void {
	void import("@react-aria/live-announcer").then(({announce}) => {
		announce(message, "polite");
	});
}
