import Container from "./container";

function WithoutStickyHeader({renderWrapper, header, content, close}) {
	return (
		<Container>
			{renderWrapper({
				children: (
					<>
						{close}
						{header}
						{content}
					</>
				),
			})}
		</Container>
	);
}

export default WithoutStickyHeader;
