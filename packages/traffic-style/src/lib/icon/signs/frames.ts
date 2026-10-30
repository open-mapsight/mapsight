import type {SignArtwork} from "./definition.ts";

/** Repository-owned SVG bases. Each size retains its original optical adjustments. */

export const warningTriangle: SignArtwork = {
	default: (colors) =>
		`<path fill="#fff" stroke="#000" d="M21.714 9.467a2 2 0 0 0-3.432-.002L6.747 28.715A2.5 2.5 0 0 0 8.892 32.5h22.186a2.5 2.5 0 0 0 2.146-3.783z"/><path fill="${colors.background ?? "#fff"}" stroke="${colors.border ?? "#b80707"}" stroke-linejoin="square" stroke-width="1.8" d="M20.079 11.606a.1.1 0 0 0-.173 0L9.289 29.846a.1.1 0 0 0 .087.15H30.42a.1.1 0 0 0 .087-.15z"/><path stroke="#fff" d="m21.294 10.912 10.428 18.24a1.5 1.5 0 0 1-1.302 2.244H9.376a1.5 1.5 0 0 1-1.297-2.254l10.617-18.24a1.5 1.5 0 0 1 2.598.01z"/>`,
	small: (colors) =>
		`<path stroke="#fff" d="m15.295 6.538 7.86 13.72a1.5 1.5 0 0 1-1.302 2.245H6.141a1.5 1.5 0 0 1-1.302-2.245l7.853-13.72a1.5 1.5 0 0 1 2.603 0z"/><path fill="${colors.background ?? "#fff"}" stroke="${colors.border ?? "#b80707"}" stroke-linejoin="square" stroke-width="1.7" d="M14.124 7.208a.15.15 0 0 0-.26 0L6.01 20.928a.15.15 0 0 0 .13.225h15.722a.15.15 0 0 0 .13-.225l-7.869-13.72z"/><path stroke="#fff" d="m15.295 6.536 7.87 13.72a1.5 1.5 0 0 1-1.302 2.247H6.141a1.5 1.5 0 0 1-1.302-2.245l7.853-13.72a1.5 1.5 0 0 1 2.603-.002z"/>`,
	xsmall: (colors) =>
		`<path stroke="#fff" d="m12.392 5.842 5.712 10.22a1 1 0 0 1-.873 1.488H5.811a1 1 0 0 1-.872-1.488l5.707-10.22a1 1 0 0 1 1.746 0z"/><path fill="${colors.background ?? "#fff"}" stroke="${colors.border ?? "#b80707"}" stroke-linejoin="square" stroke-width="1.5" d="M11.52 6.843 6.237 16.3h10.574l-5.293-9.457z"/><path stroke="#fff" d="m12.392 5.842 5.719 10.22a1 1 0 0 1-.873 1.488H5.812a1 1 0 0 1-.873-1.487l5.707-10.22a1 1 0 0 1 1.746 0z"/>`,
	plain: (colors) =>
		`<path stroke="#fff" d="m18.293 7.198 11.13 19.057a1.5 1.5 0 0 1-1.296 2.257H5.807a1.5 1.5 0 0 1-1.293-2.26l11.19-19.057a1.5 1.5 0 0 1 2.589.003z"/><path fill="${colors.background ?? "#fff"}" stroke="${colors.border ?? "#b80707"}" stroke-linejoin="square" stroke-width="1.8" d="M17.079 8.606a.1.1 0 0 0-.173 0L6.289 26.846a.1.1 0 0 0 .087.15H27.42a.1.1 0 0 0 .087-.15z"/><path stroke="#fff" d="m18.294 7.912 10.428 18.24a1.5 1.5 0 0 1-1.302 2.244H6.376a1.5 1.5 0 0 1-1.297-2.254l10.617-18.24a1.5 1.5 0 0 1 2.598.01z"/>`,
};

export const restrictionCircle: SignArtwork = {
	default: (colors) =>
		`<circle cx="20" cy="20" r="11.5" fill="#fff" stroke="#000"/><circle cx="20" cy="20" r="8.75" fill="${colors.background ?? "#fff"}" stroke="${colors.border ?? "#b80707"}" stroke-linejoin="square" stroke-width="2.5"/><circle cx="20" cy="20" r="10.5" stroke="#fff"/>`,
	small: (colors) =>
		`<circle cx="14" cy="14" r="9" fill="${colors.background ?? "#fff"}"/><circle cx="14" cy="14" r="6.9" fill="${colors.background ?? "#fff"}" stroke="${colors.border ?? "#b80707"}" stroke-linejoin="square" stroke-width="2.2"/><circle cx="14" cy="14" r="8.5" stroke="#fff"/>`,
	xsmall: (colors) =>
		`<circle cx="11" cy="11" r="6" fill="${colors.background ?? "#fff"}"/><circle cx="11" cy="11" r="4.25" fill="${colors.background ?? "#fff"}" stroke="${colors.border ?? "#b80707"}" stroke-linejoin="square" stroke-width="1.5"/><circle cx="11" cy="11" r="5.5" stroke="#fff"/>`,
	plain: (colors) =>
		`<circle cx="17" cy="17" r="11" fill="${colors.background ?? "#fff"}"/><circle cx="17" cy="17" r="8.75" fill="${colors.background ?? "#fff"}" stroke="${colors.border ?? "#b80707"}" stroke-linejoin="square" stroke-width="2.5"/><circle cx="17" cy="17" r="10.5" stroke="#fff"/>`,
};

export const parkingBase: SignArtwork = {
	default: (colors) =>
		`<g stroke-linejoin="square"><rect width="24" height="24" x="8" y="8" fill="${colors.background ?? "#035799"}" stroke="#fff" stroke-width="2" rx="4"/><rect width="25" height="25" x="7.5" y="7.5" stroke="#000" rx="4"/></g>`,
	small: (colors) =>
		`<path fill="${colors.background ?? "#035799"}" stroke="#fff" d="M14.001 5.518c2.348 0 4.473.951 6.01 2.49a8.47 8.47 0 0 1 2.49 6.01 8.47 8.47 0 0 1-2.49 6.01 8.47 8.47 0 0 1-6.01 2.49 8.47 8.47 0 0 1-6.01-2.49 8.47 8.47 0 0 1-2.49-6.01c0-2.347.952-4.472 2.49-6.01A8.47 8.47 0 0 1 14 5.518Z"/>`,
	xsmall: (colors) =>
		`<path fill="${colors.background ?? "#035799"}" stroke="#fff" d="M11 6.5c1.242 0 2.367.503 3.181 1.317A4.5 4.5 0 0 1 15.5 11a4.5 4.5 0 0 1-1.318 3.182A4.5 4.5 0 0 1 11 15.5a4.5 4.5 0 0 1-3.182-1.318A4.5 4.5 0 0 1 6.5 11a4.5 4.5 0 0 1 1.318-3.182A4.5 4.5 0 0 1 11 6.5Z"/>`,
	plain: (colors) =>
		`<rect width="23" height="23" x="5.5" y="5.5" fill="${colors.background ?? "#035799"}" stroke="#fff" rx="3"/>`,
};

export const filledCircle: SignArtwork = {
	default: (colors) =>
		`<g stroke-linejoin="square"><circle cx="20" cy="20" r="11" fill="${colors.background ?? "#b80707"}" stroke="#fff" stroke-width="2"/><circle cx="20" cy="20" r="11.5" stroke="#000"/></g>`,
	small: (colors) =>
		`<circle cx="14" cy="14" r="8.25" fill="${colors.background ?? "#b80707"}" stroke="#fff" stroke-width="1.5"/>`,
	xsmall: (colors) =>
		`<circle cx="11" cy="11" r="5.5" fill="${colors.background ?? "#b80707"}" stroke="#fff"/>`,
	plain: (colors) =>
		`<circle cx="17" cy="17" r="10.25" fill="${colors.background ?? "#b80707"}" stroke="#fff" stroke-width="1.5"/>`,
};

export const detourBase: SignArtwork = {
	default: (colors) =>
		`<rect width="25" height="25" x="7.5" y="7.5" fill="${colors.background ?? "#ffca4f"}" stroke="#000" rx="4"/>`,
	small: (colors) =>
		`<path fill="${colors.background ?? "#ffca4f"}" stroke="#fff" d="M14.001 5.518a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z"/>`,
	xsmall: (colors) =>
		`<path fill="${colors.background ?? "#ffca4f"}" fill-rule="evenodd" stroke="#fff" d="M11 6.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z"/>`,
	plain: (colors) =>
		`<rect width="24" height="24" x="5" y="5" fill="${colors.background ?? "#ffca4f"}" rx="3"/>`,
};

export const horizontalRestrictionCircle: SignArtwork = {
	default: (colors) =>
		`<g transform="rotate(90 20 20)">${restrictionCircle.default(colors)}</g>`,
	small: (colors) =>
		`<g transform="rotate(90 14 14)">${restrictionCircle.small(colors)}</g>`,
	xsmall: (colors) =>
		`<g transform="rotate(90 11 11)">${restrictionCircle.xsmall(colors)}</g>`,
	plain: (colors) =>
		`<g transform="rotate(90 17 17)">${restrictionCircle.plain(colors)}</g>`,
};
