import debounce from "lodash/debounce";
import {
	memo,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
} from "react";

import {translate} from "../../helpers/i18n";
import FeatureListCyclingButton from "./button";

import FeatureListCyclingDot from "./dot";

function FeatureListCycling({
	filteredFeatures,
	selectedFeatureId,
	highlightedFeatureId,
	onFeatureSelection,
	onFeatureHighlight,
	onFeatureUnHighlight,
}) {
	let selectedIdx;
	if (filteredFeatures?.length) {
		selectedIdx = filteredFeatures.findIndex(
			(feature) => feature.id === selectedFeatureId,
		);
	}

	if (selectedIdx === undefined) {
		selectedIdx = -2;
	}

	const handlePrev = useCallback(() => {
		if (filteredFeatures?.length) {
			if (!selectedFeatureId) {
				onFeatureSelection(filteredFeatures[0].id);
			} else if (selectedIdx > 0) {
				onFeatureSelection(filteredFeatures[selectedIdx - 1].id);
			} else {
				onFeatureSelection(
					filteredFeatures[filteredFeatures.length - 1].id,
				);
			}
		}
	}, [filteredFeatures, selectedFeatureId, onFeatureSelection, selectedIdx]);

	const handleNext = useCallback(() => {
		if (filteredFeatures?.length) {
			if (
				selectedFeatureId &&
				selectedIdx < filteredFeatures.length - 1
			) {
				onFeatureSelection(filteredFeatures[selectedIdx + 1].id);
			} else {
				onFeatureSelection(filteredFeatures[0].id);
			}
		}
	}, [filteredFeatures, selectedFeatureId, onFeatureSelection, selectedIdx]);

	const containerRef = useRef();
	const container = containerRef.current;
	const scroller = container?.querySelector(
		".ms3-list-cycling-box__dots-scroller",
	);

	const updateScroll = useCallback(() => {
		if (container && scroller) {
			const scrollerWidth = scroller.offsetWidth;

			let scrollLeft;
			const activeDotElement = scroller.querySelector(
				".ms3-list-cycling-box__dot--selected",
			);
			if (activeDotElement) {
				scrollLeft = Math.max(
					0,
					activeDotElement.offsetLeft - scrollerWidth / 2,
				);
				scroller.scrollTo({
					top: 0,
					left: scrollLeft,
					behavior: "smooth",
				});
			} else {
				scrollLeft = scroller.scrollLeft;
			}

			const shadows = container.querySelector(
				".ms3-list-cycling-box__dots-shadows",
			);
			const dots = container.querySelector(".ms3-list-cycling-box__dots");
			if (shadows && dots) {
				const dotsWidth = dots.offsetWidth;
				const hasOverflowLeft =
					dotsWidth > scrollerWidth && scrollLeft > 0;
				const hasOverflowRight = dotsWidth - scrollLeft > scrollerWidth;
				shadows.classList[hasOverflowLeft ? "add" : "remove"](
					"ms3-list-cycling-box__dots-shadows--overflow-left",
				);
				shadows.classList[hasOverflowRight ? "add" : "remove"](
					"ms3-list-cycling-box__dots-shadows--overflow-right",
				);
			}
		}
	}, [container, scroller]);

	useEffect(() => {
		const debouncedUpdateScroll = debounce(updateScroll, 500);
		window.addEventListener("resize", debouncedUpdateScroll);
		return () =>
			window.removeEventListener("resize", debouncedUpdateScroll);
	}, [updateScroll]);

	useLayoutEffect(updateScroll);

	return (
		<div className="ms3-list-cycling-box" ref={containerRef}>
			<FeatureListCyclingButton
				direction="prev"
				label={translate("prevEntry")}
				onClick={handlePrev}
			/>
			<div className="ms3-list-cycling-box__dots-shadows">
				<div className="ms3-list-cycling-box__dots-scroller">
					<div className="ms3-list-cycling-box__dots">
						{filteredFeatures?.map((feature, index) => (
							<FeatureListCyclingDot
								key={index}
								featureId={feature.id}
								isSelected={feature.id === selectedFeatureId}
								isHighlighted={
									feature.id === highlightedFeatureId
								}
								onFeatureUnHighlight={onFeatureUnHighlight}
								onFeatureHighlight={onFeatureHighlight}
								onFeatureSelection={onFeatureSelection}
								updateScroll={updateScroll}
							/>
						))}
					</div>
				</div>
			</div>
			<FeatureListCyclingButton
				direction="next"
				label={translate("nextEntry")}
				onClick={handleNext}
			/>
		</div>
	);
}

export default memo(FeatureListCycling);
