export default function scrollToElementTop(
	selector: string,
	offsetTop: number = 0,
	immediate: boolean = false,
): void {
	if (selector && typeof window !== "undefined") {
		const element = window.document.querySelector(selector);
		if (element) {
			window.scrollBy({
				left: 0,
				top: element.getBoundingClientRect().top - offsetTop,
				behavior: !immediate ? "smooth" : "auto",
			});
		}
	}
}
