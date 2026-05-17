import type Geometry from "ol/geom/Geometry";
import type Style from "ol/style/Style";

export default function bindStyleToGeometry(
	baseStyle: Style,
	geometry: Geometry,
) {
	const style = baseStyle.clone();
	style.setGeometry(geometry);
	return style;
}
