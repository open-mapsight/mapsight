import type {ElementType, ReactElement, ReactNode} from "react";
import {
	createContext,
	useCallback,
	useContext,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import {OverlayProvider} from "react-aria";
import {useDispatch, useSelector} from "react-redux";

import {animate} from "@mapsight/core/lib/map/actions";

import {MAP} from "../../config/constants/controllers";
import {translate} from "../../helpers/i18n";
import {isMapOutOfViewportSelector} from "../../store/selectors";
import type {MapsightUiFeature} from "../../types";
import {
	APP_EVENT_SCROLL_TO_MAP,
	useAppChannelDispatchEvent,
} from "../helping/app-channel";
import NativeDialog from "../native-dialog";
import OutboundLink from "../outbound-link";
import PopoverDialog from "../popover-dialog";
import {mapExtentFromFeature} from "./map-extent-from-feature";
import PlaceActionTooltip from "./place-action-tooltip";
import {resolvePlaceActions} from "./resolve-place-actions";
import type {PlaceAction, PlaceActionsConfig} from "./types";

type PlaceActionsContextValue = {
	feature: MapsightUiFeature;
	actions: PlaceAction[];
};

const PlaceActionsContext = createContext<PlaceActionsContextValue | null>(
	null,
);

function usePlaceActions(): PlaceActionsContextValue | null {
	return useContext(PlaceActionsContext);
}

function actionOf<K extends PlaceAction["kind"]>(
	actions: PlaceAction[],
	kind: K,
): Extract<PlaceAction, {kind: K}> | null {
	return (
		(actions.find((action) => action.kind === kind) as
			Extract<PlaceAction, {kind: K}> | undefined) ?? null
	);
}

function classNames(
	...parts: Array<string | false | null | undefined>
): string {
	return parts.filter(Boolean).join(" ");
}

function ActionIcon({icon}: {icon?: ReactNode}): ReactElement {
	return <span className="ms3-place-actions__icon">{icon}</span>;
}

type ActionChrome = {
	title: string;
	ariaLabel: string;
	visible: ReactNode;
	iconOnly: boolean;
};

function actionChrome(
	tooltip: string,
	label: ReactNode | undefined,
): ActionChrome {
	if (label != null) {
		return {
			title: tooltip,
			ariaLabel: typeof label === "string" ? label : tooltip,
			visible: label,
			iconOnly: false,
		};
	}
	return {
		title: tooltip,
		ariaLabel: tooltip,
		visible: null,
		iconOnly: true,
	};
}

export type PlaceActionsRootProps = {
	feature: MapsightUiFeature;
	config?: PlaceActionsConfig;
	as?: ElementType;
	className?: string;
	children?: ReactNode;
	"aria-label"?: string;
};

function Root({
	feature,
	config,
	as: T = "nav",
	className,
	children,
	"aria-label": ariaLabel,
}: PlaceActionsRootProps): ReactElement | null {
	const actions = useMemo(
		() => resolvePlaceActions(feature, config),
		[feature, config],
	);

	const value = useMemo(() => ({feature, actions}), [feature, actions]);

	if (actions.length === 0) {
		return null;
	}

	return (
		<PlaceActionsContext.Provider value={value}>
			<OverlayProvider style={{display: "contents"}}>
				<T
					className={classNames("ms3-place-actions", className)}
					aria-label={ariaLabel ?? translate("ui.place-actions.nav")}
				>
					{children}
				</T>
			</OverlayProvider>
		</PlaceActionsContext.Provider>
	);
}

export type PlaceActionPartProps = {
	as?: ElementType;
	className?: string;
	label?: ReactNode;
	icon?: ReactNode;
};

function Share({
	as: T = "button",
	className,
	label,
	icon,
}: PlaceActionPartProps): ReactElement | null {
	const ctx = usePlaceActions();
	const share = ctx ? actionOf(ctx.actions, "share") : null;
	const [dialogOpen, setDialogOpen] = useState(false);
	const [copied, setCopied] = useState(false);

	const closeDialog = useCallback(() => {
		setDialogOpen(false);
		setCopied(false);
	}, []);

	const copyPermalink = useCallback(async () => {
		if (!share) {
			return;
		}
		try {
			await window.navigator.clipboard.writeText(share.href);
			setCopied(true);
		} catch {
			setCopied(false);
		}
	}, [share]);

	const onShare = useCallback(async () => {
		if (!share) {
			return;
		}
		const canShare = typeof window.navigator.share === "function";
		if (canShare) {
			try {
				await window.navigator.share({
					title: share.title,
					url: share.href,
				});
				return;
			} catch (error) {
				if (
					error instanceof DOMException &&
					error.name === "AbortError"
				) {
					return;
				}
			}
		}
		setDialogOpen(true);
	}, [share]);

	if (!share) {
		return null;
	}

	const chrome = actionChrome(
		translate("ui.place-actions.share.tooltip"),
		label,
	);
	const permalinkLabel = translate("ui.place-actions.share.permalink");

	return (
		<span className={classNames("ms3-place-actions__share", className)}>
			<PlaceActionTooltip text={chrome.title}>
				<T
					type={T === "button" ? "button" : undefined}
					className={classNames(
						"ms3-place-actions__item",
						"ms3-place-actions__share-button",
						chrome.iconOnly && "ms3-place-actions__item--icon-only",
					)}
					aria-label={chrome.ariaLabel}
					onClick={onShare}
				>
					<ActionIcon icon={icon} />
					{chrome.visible}
				</T>
			</PlaceActionTooltip>
			<a
				className="ms3-place-actions__permalink ms3-visuallyhidden"
				href={share.href}
			>
				{permalinkLabel}
			</a>
			<NativeDialog
				isOpen={dialogOpen}
				onClose={closeDialog}
				className="ms3-place-actions__share-dialog"
				title={translate("ui.place-actions.share.dialog")}
				closeLabel={translate("ui.place-actions.share.close")}
			>
				<p className="ms3-place-actions__share-url">
					<a href={share.href}>{share.href}</a>
				</p>
				<button
					type="button"
					className="ms3-place-actions__copy"
					onClick={() => {
						void copyPermalink();
					}}
				>
					{copied
						? translate("ui.place-actions.share.copied")
						: translate("ui.place-actions.share.copy")}
				</button>
			</NativeDialog>
		</span>
	);
}

function ShowOnMapButton({
	feature,
	as: T = "button",
	className,
	label,
	icon,
}: PlaceActionPartProps & {feature: MapsightUiFeature}): ReactElement {
	const dispatch = useDispatch();
	const isMapOutOfViewport = useSelector(isMapOutOfViewportSelector);
	const dispatchAppChannelEvent = useAppChannelDispatchEvent();

	const onShowOnMap = useCallback(() => {
		const bounds = mapExtentFromFeature(feature);
		if (bounds) {
			dispatch(
				animate(MAP, {
					bounds,
					duration: 500,
					maxZoom: 17,
					padding: [60, 60, 60, 60],
				}),
			);
		}
		if (isMapOutOfViewport) {
			dispatchAppChannelEvent(new Event(APP_EVENT_SCROLL_TO_MAP));
		}
	}, [dispatch, dispatchAppChannelEvent, feature, isMapOutOfViewport]);

	const chrome = actionChrome(
		translate("ui.place-actions.show-on-map.tooltip"),
		label,
	);

	return (
		<PlaceActionTooltip text={chrome.title}>
			<T
				type={T === "button" ? "button" : undefined}
				className={classNames(
					"ms3-place-actions__item",
					"ms3-place-actions__show-on-map",
					chrome.iconOnly && "ms3-place-actions__item--icon-only",
					className,
				)}
				aria-label={chrome.ariaLabel}
				onClick={onShowOnMap}
			>
				<ActionIcon icon={icon} />
				{chrome.visible}
			</T>
		</PlaceActionTooltip>
	);
}

function CopyCoords({
	as: T = "button",
	className,
	label,
	icon,
}: PlaceActionPartProps): ReactElement | null {
	const ctx = usePlaceActions();
	const copyCoords = ctx ? actionOf(ctx.actions, "copyCoords") : null;
	const [copied, setCopied] = useState(false);

	const onCopy = useCallback(async () => {
		if (!copyCoords) {
			return;
		}
		try {
			await window.navigator.clipboard.writeText(copyCoords.text);
			setCopied(true);
		} catch {
			setCopied(false);
		}
	}, [copyCoords]);

	if (!copyCoords) {
		return null;
	}

	const tooltip = copied
		? translate("ui.place-actions.copy-coords.copied")
		: translate("ui.place-actions.copy-coords.tooltip");
	const chrome = actionChrome(tooltip, label);

	return (
		<PlaceActionTooltip text={chrome.title}>
			<T
				type={T === "button" ? "button" : undefined}
				className={classNames(
					"ms3-place-actions__item",
					"ms3-place-actions__copy-coords",
					chrome.iconOnly && "ms3-place-actions__item--icon-only",
					className,
				)}
				aria-label={chrome.ariaLabel}
				onClick={() => {
					void onCopy();
				}}
			>
				<ActionIcon icon={icon} />
				{chrome.visible}
			</T>
		</PlaceActionTooltip>
	);
}

function ShowOnMap(props: PlaceActionPartProps): ReactElement | null {
	const ctx = usePlaceActions();
	const showOnMap = ctx ? actionOf(ctx.actions, "showOnMap") : null;
	if (!showOnMap || !ctx) {
		return null;
	}
	return <ShowOnMapButton {...props} feature={ctx.feature} />;
}

function Navigate({
	as: T = "button",
	className,
	label,
	icon,
}: PlaceActionPartProps): ReactElement | null {
	const ctx = usePlaceActions();
	const navigate = ctx ? actionOf(ctx.actions, "navigate") : null;
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const menuId = useId();

	if (!navigate) {
		return null;
	}

	const chrome = actionChrome(
		translate("ui.place-actions.navigate.tooltip"),
		label,
	);

	return (
		<span className={classNames("ms3-place-actions__navigate", className)}>
			<PlaceActionTooltip text={chrome.title}>
				<T
					ref={T === "button" ? triggerRef : undefined}
					type={T === "button" ? "button" : undefined}
					className={classNames(
						"ms3-place-actions__item",
						"ms3-place-actions__navigate-button",
						chrome.iconOnly && "ms3-place-actions__item--icon-only",
					)}
					aria-label={chrome.ariaLabel}
					aria-expanded={open}
					aria-haspopup="dialog"
					aria-controls={open ? menuId : undefined}
					onClick={() => setOpen((current) => !current)}
				>
					<ActionIcon icon={icon} />
					{chrome.visible}
				</T>
			</PlaceActionTooltip>
			<PopoverDialog
				isOpen={open}
				onClose={() => setOpen(false)}
				triggerRef={triggerRef}
				id={menuId}
				aria-label={translate("ui.place-actions.navigate.menu")}
				hideCloseButton
				className="ms3-place-actions__navigate-menu"
			>
				<ul className="ms3-place-actions__navigate-list">
					{navigate.targets.map((target) => (
						<li key={target.id}>
							<OutboundLink
								href={target.href}
								className="ms3-place-actions__navigate-target"
							>
								{target.label}
							</OutboundLink>
						</li>
					))}
				</ul>
			</PopoverDialog>
		</span>
	);
}

function Website({
	as: T = OutboundLink,
	className,
	label,
	icon,
}: PlaceActionPartProps): ReactElement | null {
	const ctx = usePlaceActions();
	const website = ctx ? actionOf(ctx.actions, "website") : null;

	if (!website) {
		return null;
	}

	const chrome = actionChrome(
		translate("ui.place-actions.website.tooltip"),
		label,
	);

	return (
		<PlaceActionTooltip text={chrome.title}>
			<T
				href={website.href}
				className={classNames(
					"ms3-place-actions__item",
					"ms3-place-actions__website",
					chrome.iconOnly && "ms3-place-actions__item--icon-only",
					className,
				)}
				aria-label={chrome.ariaLabel}
				rel="external noreferrer noopener"
				target="_blank"
			>
				<ActionIcon icon={icon} />
				{chrome.visible}
			</T>
		</PlaceActionTooltip>
	);
}

function Call({
	as: T = "a",
	className,
	label,
	icon,
}: PlaceActionPartProps): ReactElement | null {
	const ctx = usePlaceActions();
	const call = ctx ? actionOf(ctx.actions, "call") : null;

	if (!call) {
		return null;
	}

	const tooltip = `${translate("ui.place-actions.call.tooltip")}: ${call.telephone}`;
	const chrome = actionChrome(tooltip, label);

	return (
		<PlaceActionTooltip text={tooltip}>
			<T
				href={call.href}
				className={classNames(
					"ms3-place-actions__item",
					"ms3-place-actions__call",
					chrome.iconOnly && "ms3-place-actions__item--icon-only",
					className,
				)}
				aria-label={chrome.ariaLabel}
			>
				<ActionIcon icon={icon} />
				{chrome.visible}
			</T>
		</PlaceActionTooltip>
	);
}

const PlaceActions = {
	Root,
	Share,
	CopyCoords,
	ShowOnMap,
	Navigate,
	Website,
	Call,
};

export default PlaceActions;
