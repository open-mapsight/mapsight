const ButtonBadge = ({
	className = "",
	...props
}: {className?: string} & React.HTMLAttributes<HTMLSpanElement>) => (
	<span
		className={`ms3-vector-editor-button__badge ${className}`}
		{...props}
	/>
);

export default ButtonBadge;
