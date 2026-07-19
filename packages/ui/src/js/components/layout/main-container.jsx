/**
 * @deprecated The extra `ms3-flex*` utility classes are for pre-OSS capture CSS.
 *   Prefer theme layout SCSS. Utility classes may be dropped in the next major
 *   of `@mapsight/ui`.
 */
function MainContainer({as: T = "div", ...props}) {
	return (
		<T className="ms3-main-container ms3-flex ms3-flex--column" {...props} />
	);
}

export default MainContainer;
