import {
	type CSSProperties,
	type ChangeEvent,
	Children,
	type ReactNode,
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import {
	DismissButton,
	FocusScope,
	OverlayContainer,
	useButton,
} from "react-aria";

import {hasGeolocationSupport} from "@mapsight/core/lib/helpers";

import {translate} from "../../../helpers/i18n";
import usePopoverDialog from "../../../hooks/usePopoverDialog";
import CloseOverlayButton from "../../close-overlay-button";
import {renderPlaceOptions} from "../../feature-list-sorting/feature-list-sorting";
import useListOptionsController from "./useListOptionsController";

export type FeatureListOptionsPopoverProps = {
	/** Tag / filter controls rendered in the Filter section when present. */
	children?: ReactNode;
	/** Extra class on the root (`display: contents` wrapper). */
	className?: string;
};

/**
 * Compact list filter/sort popover for feature-list headers: sorting by place /
 * geolocation, optional tag filters (children), and reset.
 *
 * Pair with a custom `headerAs` that places the search/filter control beside
 * this popover and moves tag-switcher children into `children`.
 */
export default function FeatureListOptionsPopover({
	children,
	className,
}: FeatureListOptionsPopoverProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [maxHeight, setMaxHeight] = useState<number | null>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);
	const updatePositionRef = useRef<() => void>(() => {});
	const {
		featureCount,
		totalFeatureCount,
		sorting,
		places,
		geolocationStatus,
		activeFilterCount,
		canResetOptions,
		hasCustomSorting,
		setSorting,
		reset,
	} = useListOptionsController();

	const hasTagControls = Children.count(children) > 0;
	const hasActiveState = isOpen || activeFilterCount > 0 || hasCustomSorting;
	const triggerLabel = hasTagControls ? (
		<div className="ms3-list-options__count">
			<span>
				{featureCount === totalFeatureCount
					? `${featureCount} ${translate("ui.feature-list.options.entries")}`
					: `${featureCount} / ${totalFeatureCount} ${translate("ui.feature-list.options.entries")}`}
			</span>
			{activeFilterCount > 0 ? (
				<span>{translate("ui.feature-list.options.filterActive")}</span>
			) : null}
		</div>
	) : null;

	const close = useCallback(() => setIsOpen(false), []);
	const open = useCallback(() => setIsOpen(true), []);

	const {popoverProps, titleProps, triggerAriaProps, updatePosition} =
		usePopoverDialog({
			isOpen,
			onClose: close,
			triggerRef,
			popoverRef,
			placement: "bottom start",
			offset: 6,
			shouldCloseOnBlur: false,
			popoverId: "ms3-list-options-popover",
		});

	const {buttonProps} = useButton(
		{
			...triggerAriaProps,
			onPress: () => {
				if (isOpen) {
					close();
					return;
				}
				open();
			},
		},
		triggerRef,
	);

	useLayoutEffect(() => {
		updatePositionRef.current = updatePosition;
	});

	const updateMaxHeight = useCallback(() => {
		const trigger = triggerRef.current;
		const popover = popoverRef.current;
		if (!trigger || !popover) {
			return;
		}

		const wrapper =
			trigger.closest(".ms3-panel__inner") ??
			trigger.closest(".ms3-list-wrapper");
		const wrapperBottom =
			wrapper instanceof HTMLElement
				? wrapper.getBoundingClientRect().bottom
				: window.innerHeight;
		const popoverTop = popover.getBoundingClientRect().top;
		const nextMaxHeight = Math.max(180, wrapperBottom - popoverTop - 12);

		setMaxHeight((currentMaxHeight) =>
			currentMaxHeight === nextMaxHeight
				? currentMaxHeight
				: nextMaxHeight,
		);
	}, []);

	useLayoutEffect(() => {
		if (!isOpen) {
			return;
		}

		updatePositionRef.current();
		updateMaxHeight();
		window.addEventListener("resize", updateMaxHeight);
		window.addEventListener("scroll", updateMaxHeight, true);

		return () => {
			window.removeEventListener("resize", updateMaxHeight);
			window.removeEventListener("scroll", updateMaxHeight, true);
		};
	}, [isOpen, updateMaxHeight]);

	const handleSortingChange = useCallback(
		(event: ChangeEvent<HTMLSelectElement>) => {
			setSorting(event.target.value);
		},
		[setSorting],
	);

	const triggerTitle = translate("ui.feature-list.options.trigger");
	const rootClassName = ["ms3-list-options", className]
		.filter(Boolean)
		.join(" ");

	return (
		<div className={rootClassName}>
			<div className="ms3-list-options__trigger-row">
				<button
					{...buttonProps}
					ref={triggerRef}
					type="button"
					className={[
						"ms3-list-options__trigger",
						"ms3-filter-button",
						hasActiveState
							? "ms3-filter-button--icon-sort-active"
							: "ms3-filter-button--icon-sort",
					].join(" ")}
					title={triggerTitle}
					aria-label={triggerTitle}
				>
					<i>{triggerTitle}</i>
				</button>
			</div>
			{triggerLabel ? (
				<div className="ms3-list-options__trigger-label">
					{triggerLabel}
				</div>
			) : null}

			{isOpen ? (
				<OverlayContainer>
					<FocusScope restoreFocus contain>
						<div
							{...popoverProps}
							ref={popoverRef}
							className="ms3-list-options__popover"
							style={
								{
									...popoverProps.style,
									"--ms3-list-options-max-height":
										maxHeight === null
											? undefined
											: `${maxHeight}px`,
								} as CSSProperties
							}
						>
							<DismissButton onDismiss={close} />
							<div className="ms3-list-options__header">
								<h3
									{...titleProps}
									className="ms3-list-options__title"
								>
									{translate("ui.feature-list.options.title")}
								</h3>
								<CloseOverlayButton
									label={translate(
										"ui.feature-list.options.close",
									)}
									onClose={close}
								/>
							</div>

							<div className="ms3-list-options__body">
								<section className="ms3-list-options__section">
									<h4 className="ms3-list-options__section-title">
										{translate(
											"ui.feature-list.options.sorting",
										)}
									</h4>
									<label className="ms3-list-options__field">
										<span className="ms3-list-options__label">
											{translate(
												"ui.feature-list.options.location",
											)}
										</span>
										<select
											className="ms3-list-options__select"
											value={sorting}
											onChange={handleSortingChange}
										>
											<option value="">
												{translate(
													"ui.feature-list.sorting.choose",
												)}
											</option>
											{hasGeolocationSupport ? (
												<option value="geolocation">
													{translate(
														"ui.feature-list.sorting.own",
													)}
												</option>
											) : null}
											{renderPlaceOptions(places)}
										</select>
									</label>
									<div
										className={
											"ms3-status-indicator" +
											(geolocationStatus
												? ` ms3-status-indicator--${geolocationStatus}`
												: "")
										}
									/>
								</section>

								{hasTagControls ? (
									<section className="ms3-list-options__section">
										<h4 className="ms3-list-options__section-title">
											{translate(
												"ui.feature-list.options.filter",
											)}
										</h4>
										{children}
									</section>
								) : null}
							</div>
							<div className="ms3-list-options__footer">
								<button
									type="button"
									className="ms3-list-options__reset"
									onClick={reset}
									disabled={!canResetOptions}
								>
									{translate("ui.feature-list.options.reset")}
								</button>
							</div>
							<DismissButton onDismiss={close} />
						</div>
					</FocusScope>
				</OverlayContainer>
			) : null}
		</div>
	);
}
