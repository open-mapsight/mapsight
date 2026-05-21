import type {ReactNode} from "react";
import {useSelector} from "react-redux";

import useStickyHeader from "../../hooks/useStickyHeader";
import {featureSelectionInfoUiOptionsSelector} from "../../store/selectors";
import type {MapsightUiFeature} from "../../types";
import Container from "./container";

const stopEventPropagation = (e) => e.stopPropagation();

type WithStickyHeaderProps = {
	header: ReactNode;
	feature: MapsightUiFeature;
	content: ReactNode;
	close: ReactNode;
	renderWrapper: (props: any) => ReactNode;
};

function WithStickyHeader({
	header,
	content,
	feature,
	close,
	renderWrapper,
}: WithStickyHeaderProps) {
	const {stuckHeaderHeight} = useSelector(
		featureSelectionInfoUiOptionsSelector,
	);
	const {isHeaderStuck, stickyHeaderRef, stickyScrollAreaRef, onScroll} =
		useStickyHeader<HTMLDivElement>({
			stuckHeaderHeight,
			resetDeps: [feature.id],
		});

	const stuckClass = (prefix) =>
		prefix + " " + (isHeaderStuck ? prefix + "--stuck" : "");
	const stuckHeaderClasses = `ms3-sticky-header__header ${
		isHeaderStuck
			? "ms3-sticky-header__header--stuck"
			: "ms3-sticky-header__header--stuck-placeholder"
	}`;
	const stickyHeaderClasses = `ms3-sticky-header__header ${
		isHeaderStuck
			? "ms3-sticky-header__header--sticky-placeholder"
			: "ms3-sticky-header__header--sticky"
	}`;

	return (
		<Container className={stuckClass("ms3-sticky-header__container")}>
			<div aria-hidden="true" className={stuckHeaderClasses}>
				{header}
			</div>

			{renderWrapper({
				ref: stickyScrollAreaRef,
				className: stuckClass("ms3-sticky-header__scroll-area"),
				onTouchMove: stopEventPropagation,
				onScroll: onScroll,
				children: (
					<>
						{close}
						<div
							className={stickyHeaderClasses}
							ref={stickyHeaderRef}
						>
							{header}
						</div>
						{content}
					</>
				),
			})}
		</Container>
	);
}

export default WithStickyHeader;
