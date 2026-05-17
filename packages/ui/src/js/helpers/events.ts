/**
 * Returns `true` if no modifier key is pressed for the event.
 */
export function isEventWithNoModKeys(event: {
	altKey: boolean;
	ctrlKey: boolean;
	shiftKey: boolean;
	metaKey: boolean;
}): boolean {
	return !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}
