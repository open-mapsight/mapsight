export type StickyState = "default" | "sticky" | "stuck";
export type StickyOptions = {
	offset?: number;
	verticalPosition?: "top" | "bottom";
	onChange?: (state: StickyState) => void;
};

const parentClass = "js-sticky-parent";
const willStickClass = "js-will-stick";
const stickyClass = "js-is-sticky";
const stuckClass = "js-is-stuck";

const DEFAULT_OPTIONS: Required<StickyOptions> = {
	offset: 0,
	verticalPosition: "top",
	onChange: (_state) => undefined,
};

function getStickPositionValue() {
	const prefix = ["", "-webkit-"];
	const test = document.head.style;
	for (let i = 0; i < prefix.length; i += 1) {
		test.position = `${prefix[i]}sticky`;
	}
	let stickyProp = "fixed";
	if (typeof test.position !== "undefined") {
		stickyProp = test.position;
	}
	test.position = "";
	return stickyProp;
}

export default function makeSticky(
	targetElement: HTMLElement,
	scrollElement: HTMLElement | Window = window,
	options: StickyOptions = {},
) {
	if (typeof window === "undefined") {
		return () => undefined;
	}

	const positionValue = getStickPositionValue();
	const useFixed = positionValue === "fixed";

	const {
		offset: optionOffset,
		verticalPosition,
		onChange,
	} = {...DEFAULT_OPTIONS, ...options};

	let state: StickyState = "default";

	if (verticalPosition === "top") {
		targetElement.style[verticalPosition] = `${optionOffset}px`;
	}

	if (!useFixed) {
		targetElement.style.position = positionValue;
	}

	targetElement.classList.add(willStickClass);

	const isWindow = scrollElement === window;
	const delay = isWindow
		? (f: () => void) => window.requestAnimationFrame(f)
		: (f: () => void) => f();
	const parentElement = targetElement.parentElement!;
	parentElement.className += ` ${parentClass}`;

	const isFixedWithOffset = !isWindow && positionValue === "fixed";
	const scrollElementOffset = isFixedWithOffset
		? (scrollElement as HTMLElement).getBoundingClientRect().top
		: 0;
	const offset = scrollElementOffset + optionOffset;
	const parentOffset = parentElement.getBoundingClientRect().top;
	const parentHeight = parentElement.offsetHeight;
	const targetHeight = targetElement.offsetHeight;
	const stickyStart = parentOffset - scrollElementOffset - offset;
	const stickyStop =
		parentOffset + parentHeight - scrollElementOffset - targetHeight;
	const scrollListener = () => {
		const scroll = isWindow
			? window.scrollY || window.pageYOffset
			: (scrollElement as HTMLElement).scrollTop;

		const isBelow = scroll >= stickyStop;
		if (isBelow && state === "sticky") {
			state = "stuck";

			delay(() => {
				targetElement.classList.remove(stickyClass);
				targetElement.classList.add(stuckClass);

				if (useFixed) {
					targetElement.style.top = "";
					targetElement.style.bottom = "0";
					targetElement.style.position = "absolute";
				}

				onChange(state);
			});

			return;
		}

		const isAbove = scroll <= stickyStart;
		if (!isAbove && !isBelow) {
			if (state !== "sticky") {
				state = "sticky";

				delay(() => {
					targetElement.classList.remove(willStickClass);
					targetElement.classList.remove(stuckClass);
					targetElement.classList.add(stickyClass);
					targetElement.style.position = positionValue;
					targetElement.style.bottom = "";
					targetElement.style[verticalPosition] = `${optionOffset}px`;

					onChange(state);
				});
			}

			return;
		}

		if (state !== "default") {
			state = "default";

			delay(() => {
				targetElement.classList.remove(stickyClass);
				targetElement.classList.remove(stuckClass);
				targetElement.classList.add(willStickClass);

				if (useFixed) {
					targetElement.style.position = "";
				}

				onChange(state);
			});
		}
	};
	scrollElement.addEventListener("scroll", scrollListener, {passive: true});

	return function cleanup() {
		scrollElement.removeEventListener("scroll", scrollListener);
		targetElement.style.position = "";
		targetElement.style[verticalPosition] = "";
		targetElement.classList.remove(stickyClass);
		targetElement.classList.remove(stuckClass);
		targetElement.classList.remove(willStickClass);
		targetElement.parentElement!.classList.remove(parentClass);
	};
}
