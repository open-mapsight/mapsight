import type {HTMLAttributes, KeyboardEvent} from "react";
import {useEffect, useRef} from "react";

/** A single Tab stop; arrow keys wrap, move focus and select the next radio. */
export default function SwitcherRadioGroup({
	children,
	...props
}: HTMLAttributes<HTMLUListElement>) {
	const ref = useRef<HTMLUListElement>(null);
	useEffect(() => {
		const radios = Array.from(
			ref.current?.querySelectorAll<HTMLButtonElement>(
				'[role="radio"]:not(:disabled)',
			) ?? [],
		);
		const selected =
			radios.find(
				(radio) => radio.getAttribute("aria-checked") === "true",
			) ?? radios[0];
		for (const radio of radios) {
			radio.tabIndex = radio === selected ? 0 : -1;
		}
	});
	const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
		if (
			event.altKey ||
			event.ctrlKey ||
			event.metaKey ||
			event.defaultPrevented
		) {
			return;
		}
		const direction = ["ArrowRight", "ArrowDown"].includes(event.key)
			? 1
			: ["ArrowLeft", "ArrowUp"].includes(event.key)
				? -1
				: 0;
		if (!direction) {
			return;
		}
		const radios = Array.from(
			event.currentTarget.querySelectorAll<HTMLButtonElement>(
				'[role="radio"]:not(:disabled)',
			),
		);
		const index = radios.indexOf(event.target as HTMLButtonElement);
		if (index < 0) {
			return;
		}
		event.preventDefault();
		const next =
			radios[(index + direction + radios.length) % radios.length];
		next?.focus();
		next?.click();
	};
	return (
		<ul {...props} ref={ref} role="radiogroup" onKeyDown={onKeyDown}>
			{children}
		</ul>
	);
}
