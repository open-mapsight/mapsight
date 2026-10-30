import type {HTMLAttributes, ReactNode, RefAttributes} from "react";

import Container from "./container";

export type WithoutStickyHeaderProps = {
	header: ReactNode;
	content: ReactNode;
	close: ReactNode;
	renderWrapper: (
		props: HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>,
	) => ReactNode;
};

function WithoutStickyHeader({
	renderWrapper,
	header,
	content,
	close,
}: WithoutStickyHeaderProps) {
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
