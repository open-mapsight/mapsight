import type {MouseEvent, ReactNode} from "react";
import {useCallback, useId} from "react";

import {translate} from "../helpers/i18n";
import useHydrated from "../hooks/useHydrated";

export type LinkShareProps = {
	buttonLabel?: string;
	title?: string;
	inputLabel?: string;
	/** Visible label above the link; the input is then labelled by it. */
	label?: ReactNode;
	url: string | null;
	onFinished?: () => void;
	onError?: () => void;
};

const selectInputContent = (e: MouseEvent<HTMLInputElement>) =>
	e.currentTarget.setSelectionRange(0, e.currentTarget.value.length);

function LinkShare({
	buttonLabel = translate("shareLink"),
	title = translate("shareLink"),
	inputLabel = translate("ui.link-share.input"),
	label,
	url,
	onFinished,
	onError,
}: LinkShareProps) {
	const hydrated = useHydrated();
	const inputId = useId();
	const canShare = hydrated && typeof navigator?.share === "function";
	const share = useCallback(
		function () {
			if (navigator?.share) {
				navigator
					.share({
						title: title,
						url: url ?? undefined,
					})
					.then(() => {
						if (onFinished) {
							onFinished();
						}
					})
					.catch((err) => {
						console.error(err);
						if (onError) {
							onError();
						}
					});
			}
		},
		[onError, onFinished, title, url],
	);

	return (
		<div
			className={
				label
					? "ms3-link-share ms3-link-share--labelled"
					: "ms3-link-share"
			}
		>
			{label ? (
				<label className="ms3-link-share__label" htmlFor={inputId}>
					{label}
				</label>
			) : null}
			{canShare ? (
				<button
					className="ms3-link-share__button"
					type="button"
					onClick={share}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="22"
						viewBox="0 0 20 22"
					>
						<path
							fill="#000"
							d="M10.86.91l4.42 4.42-1.33 1.32L11 3v10H9V3L6.06 6.6 4.7 5.37 9.15.9 9.13.87l.84-.84.03.03.03-.03.85.86z"
						/>
						<path
							stroke="#000"
							strokeLinecap="square"
							strokeWidth="2"
							d="M1 21h18M1 21V9M19 21V9M14 9h5M1 9h5"
						/>
					</svg>
					<span className="ms3-visuallyhidden">{buttonLabel}</span>
				</button>
			) : null}
			<input
				id={label ? inputId : undefined}
				className="ms3-link-share__input"
				aria-label={label ? undefined : inputLabel}
				value={url ?? undefined}
				onClick={selectInputContent}
				readOnly={true}
			/>
		</div>
	);
}

export default LinkShare;
