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

import {translate} from "../../helpers/i18n";
import type {MapsightUiFeature} from "../../types";
import NativeDialog from "../native-dialog";
import OutboundLink from "../outbound-link";
import PopoverDialog from "../popover-dialog";
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
			<T
				className={classNames("ms3-place-actions", className)}
				aria-label={ariaLabel ?? translate("ui.place-actions.nav")}
			>
				{children}
			</T>
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

	const text = label ?? translate("ui.place-actions.share");
	const permalinkLabel = translate("ui.place-actions.share.permalink");

	return (
		<span className={classNames("ms3-place-actions__share", className)}>
			<T
				type={T === "button" ? "button" : undefined}
				className="ms3-place-actions__item ms3-place-actions__share-button"
				onClick={onShare}
			>
				{icon ? (
					<span className="ms3-place-actions__icon">{icon}</span>
				) : null}
				{text}
			</T>
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

	const text = label ?? translate("ui.place-actions.navigate");

	return (
		<span className={classNames("ms3-place-actions__navigate", className)}>
			<T
				ref={T === "button" ? triggerRef : undefined}
				type={T === "button" ? "button" : undefined}
				className="ms3-place-actions__item ms3-place-actions__navigate-button"
				aria-expanded={open}
				aria-haspopup="dialog"
				aria-controls={open ? menuId : undefined}
				onClick={() => setOpen((current) => !current)}
			>
				{icon ? (
					<span className="ms3-place-actions__icon">{icon}</span>
				) : null}
				{text}
			</T>
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

	const text = label ?? translate("ui.place-actions.website");

	return (
		<T
			href={website.href}
			className={classNames(
				"ms3-place-actions__item",
				"ms3-place-actions__website",
				className,
			)}
			rel="external noreferrer noopener"
			target="_blank"
		>
			{icon ? (
				<span className="ms3-place-actions__icon">{icon}</span>
			) : null}
			{text}
		</T>
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

	const text = label ?? translate("ui.place-actions.call");
	const accessibleName =
		typeof text === "string" ? text : translate("ui.place-actions.call");

	return (
		<T
			href={call.href}
			className={classNames(
				"ms3-place-actions__item",
				"ms3-place-actions__call",
				className,
			)}
			aria-label={`${accessibleName} ${call.telephone}`}
		>
			{icon ? (
				<span className="ms3-place-actions__icon">{icon}</span>
			) : null}
			{text}
		</T>
	);
}

const PlaceActions = {
	Root,
	Share,
	Navigate,
	Website,
	Call,
};

export default PlaceActions;
