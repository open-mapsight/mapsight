import type {Position} from "geojson";

function Coords({
	coords,
	precision = 3,
	delimiter = "/",
}: {
	coords: Position;
	precision?: number;
	delimiter?: string;
}) {
	const factor = 10 ** precision;
	let [y, x] = coords as [number, number];
	x = Math.round(x * factor) / factor;
	y = Math.round(y * factor) / factor;

	return (
		<span className="ms3-vector-editor-coords" data-x={x} data-y={y}>
			<span
				className="ms3-vector-editor-coords__coord ms3-vector-editor-coords__coord--x"
				data-val={x}
			>
				{x}
			</span>
			<span className="ms3-vector-editor-coords__delimiter">
				{delimiter}
			</span>
			<span
				className="ms3-vector-editor-coords__coord ms3-vector-editor-coords__coord--y"
				data-val={y}
			>
				{y}
			</span>
		</span>
	);
}

export default Coords;
