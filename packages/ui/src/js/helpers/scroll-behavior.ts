/** Query at the time of scrolling so OS preference changes take effect immediately. */
export default function scrollBehavior(): ScrollBehavior {
	return typeof window !== "undefined" &&
		typeof window.matchMedia === "function" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches
		? "instant"
		: "smooth";
}
