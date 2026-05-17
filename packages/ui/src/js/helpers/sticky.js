const parentClass = "js-sticky-parent";
const willStickClass = "js-will-stick";
const stickyClass = "js-is-sticky";
const stuckClass = "js-is-stuck";

const DEFAULT_OPTIONS = {
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
	targetElement,
	scrollElement = window,
	options = {},
) {
	if (typeof window === "undefined") {
		return () => undefined;
	}

	const positionValue = getStickPositionValue();
	const useFixed = positionValue === "fixed";

	options = {...DEFAULT_OPTIONS, ...options};

	let state = "default";

	if (options.verticalPosition === "top") {
		targetElement.style[options.verticalPosition] = `${options.offset}px`;
	}

	if (!useFixed) {
		targetElement.style.position = positionValue;
	}

	targetElement.classList.add(willStickClass);

	const isWindow = scrollElement === window;
	const delay = (isWindow && window.requestAnimationFrame) || ((f) => f());
	const parentElement = targetElement.parentNode;
	parentElement.className += ` ${parentClass}`;

	const isFixedWithOffset = !isWindow && positionValue === "fixed";
	const scrollElementOffset = isFixedWithOffset
		? scrollElement.getBoundingClientRect().top
		: 0;
	const offset = scrollElementOffset + options.offset;
	const parentOffset = parentElement.getBoundingClientRect().top;
	const parentHeight = parentElement.offsetHeight;
	const targetHeight = targetElement.offsetHeight;
	const stickyStart = parentOffset - scrollElementOffset - offset;
	const stickyStop =
		parentOffset + parentHeight - scrollElementOffset - targetHeight;
	const scrollListener = () => {
		const scroll = isWindow
			? window.scrollY || window.pageYOffset
			: scrollElement.scrollTop;

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

				options.onChange(state);
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
					targetElement.style[options.verticalPosition] =
						`${options.offset}px`;

					options.onChange(state);
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

				options.onChange(state);
			});
		}
	};
	scrollElement.addEventListener("scroll", scrollListener, {passive: true});

	return function cleanup() {
		scrollElement.removeEventListener("scroll", scrollListener, {
			passive: true,
		});
		targetElement.style.position = "";
		targetElement.style[options.verticalPosition] = "";
		targetElement.classList.remove(stickyClass);
		targetElement.classList.remove(stuckClass);
		targetElement.classList.remove(willStickClass);
		targetElement.parentNode.classList.remove(parentClass);
	};
}
