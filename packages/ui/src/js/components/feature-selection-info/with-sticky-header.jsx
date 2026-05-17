import {useSelector} from "react-redux";
import useStickyHeader from "../../hooks/useStickyHeader";

import {featureSelectionInfoStuckHeaderHeightSelector} from "../../store/selectors.ts";

import Container from "./container";

const stopEventPropagation = (e) => e.stopPropagation();

function WithStickyHeader({header, content, feature, close, renderWrapper}) {
	const stuckHeaderHeight = useSelector(
		featureSelectionInfoStuckHeaderHeightSelector,
	);
	const {isHeaderStuck, stickyHeaderRef, stickyScrollAreaRef, onScroll} =
		useStickyHeader({
			stuckHeaderSize: stuckHeaderHeight,
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
