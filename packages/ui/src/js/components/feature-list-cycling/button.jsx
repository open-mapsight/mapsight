function FeatureListCyclingButton({direction, label, ...rest}) {
	return (
		<button
			type="button"
			className={`ms3-list-cycling-box__button ms3-list-cycling-box__button--${direction}`}
			{...rest}
		>
			<span className="ms3-visuallyhidden">{label}</span>
		</button>
	);
}

export default FeatureListCyclingButton;
