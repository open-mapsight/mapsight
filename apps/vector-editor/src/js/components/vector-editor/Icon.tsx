type IconProps = {
	name: string;
	attributes?: any;
};

function Icon({name, attributes = {}}: IconProps) {
	const src = new URL(`/src/icons/${name}.svg`, import.meta.url).href;

	return (
		<img
			alt=""
			src={src}
			className="ms3-vector-editor-icon"
			{...attributes}
		/>
	);
}

export default Icon;
