/**
 * @deprecated The extra `ms3-flex*` utility classes are for pre-OSS capture CSS
 *   where `.ms3-map-row` was only `position: relative`. Prefer theme SCSS
 *   (`_map-row.scss`). Utility classes may be dropped in the next major of
 *   `@mapsight/ui`.
 */
function MapRow({as: T = "div", ...props}) {
	return (
		<T
			className="ms3-map-row [ ms3-flex ms3-flex-grow ms3-flex--row ]"
			{...props}
		/>
	);
}

export default MapRow;
