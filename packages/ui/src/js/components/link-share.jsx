/* eslint-disable n/no-unsupported-features/node-builtins */
import {useCallback} from "react";

import {translate} from "../helpers/i18n";

const selectInputContent = (e) =>
	e.target.setSelectionRange(0, e.target.value.length);

function LinkShare({
	buttonLabel = translate("shareLink"),
	title = translate("shareLink"),
	url,
	onFinished,
	onError,
}) {
	const share = useCallback(
		function () {
			if (navigator?.share) {
				navigator
					.share({
						title: title,
						url: url,
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
		<div className="ms3-link-share">
			{navigator?.share ? (
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
				className="ms3-link-share__input"
				value={url}
				onClick={selectInputContent}
				readOnly={true}
			/>
		</div>
	);
}

export default LinkShare;
