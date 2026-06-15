import {type ReactNode, useState} from "react";

import {resolveIconVariantId} from "@mapsight/traffic-style/icon-meta";
import type {IconVariant} from "@mapsight/traffic-style/runtime";
import {useMapsightIcon} from "@mapsight/ui/hooks/useMapsightIcon";

import {
	type CatalogSectionKind,
	getCatalogIconGroups,
} from "./catalog-sections.ts";
import {buildMapsightIcon} from "./map-config.ts";

const VARIANTS: IconVariant[] = ["default", "small", "xsmall", "plain"];

function prebuiltIconSrc(id: string, variant: IconVariant): string {
	return `/img/mapsight-icons-svg/${resolveIconVariantId(id, variant)}-${variant}.svg`;
}

export function CatalogGrid({
	ids,
	kind,
	background,
	foregroundOverride,
	darkPreview,
	showVariants,
	activeId = "",
	onSelect,
	showLabels = false,
}: {
	ids: string[];
	kind: CatalogSectionKind;
	background: string;
	foregroundOverride: string | null;
	darkPreview: boolean;
	showVariants: boolean;
	activeId?: string;
	onSelect?: (id: string) => void;
	showLabels?: boolean;
}) {
	const [copiedId, setCopiedId] = useState("");

	function copyIconId(id: string) {
		setCopiedId(id);

		// eslint-disable-next-line n/no-unsupported-features/node-builtins -- This runs in the browser showcase, not Node.
		void window.navigator.clipboard?.writeText(id).catch(() => {
			setCopiedId("");
		});
		window.setTimeout(() => setCopiedId(""), 1600);
	}

	return (
		<div
			className={`catalog-grid${showLabels ? " catalog-grid--page" : ""}`}
		>
			{ids.map((id) => (
				<CatalogGridItem
					key={id}
					id={id}
					kind={kind}
					background={background}
					foregroundOverride={foregroundOverride}
					copied={
						copiedId ===
						buildCopyId(id, kind, background, foregroundOverride)
					}
					darkPreview={darkPreview}
					showVariants={showVariants}
					active={Boolean(activeId) && id === activeId}
					onSelect={onSelect}
					onCopy={copyIconId}
					interactive={typeof onSelect === "function"}
				/>
			))}
		</div>
	);
}

function buildCopyId(
	id: string,
	kind: CatalogSectionKind,
	background: string,
	foregroundOverride: string | null,
) {
	if (kind === "prebuilt") {
		return id;
	}

	return buildMapsightIcon({
		pictogram: id,
		label: "",
		background,
		foregroundOverride,
	});
}

function CatalogGridItem({
	id,
	kind,
	background,
	foregroundOverride,
	copied,
	darkPreview,
	showVariants,
	active,
	onSelect,
	onCopy,
	interactive,
}: {
	id: string;
	kind: CatalogSectionKind;
	background: string;
	foregroundOverride: string | null;
	copied: boolean;
	darkPreview: boolean;
	showVariants: boolean;
	active: boolean;
	onSelect?: (id: string) => void;
	onCopy: (id: string) => void;
	interactive: boolean;
}) {
	const copyId = buildCopyId(id, kind, background, foregroundOverride);

	if (kind === "prebuilt") {
		return (
			<CatalogGridItemShell
				id={id}
				copyId={copyId}
				copied={copied}
				darkPreview={darkPreview}
				active={active}
				onSelect={onSelect}
				onCopy={onCopy}
				interactive={interactive}
			>
				{showVariants ? (
					<div className="catalog-grid-item__variants">
						{VARIANTS.map((variant) => (
							<figure key={variant}>
								<img
									src={prebuiltIconSrc(id, variant)}
									alt=""
									title={variant}
								/>
							</figure>
						))}
					</div>
				) : (
					<img src={prebuiltIconSrc(id, "default")} alt="" />
				)}
			</CatalogGridItemShell>
		);
	}

	return (
		<RuntimeCatalogGridItem
			id={id}
			mapsightIconId={copyId}
			copied={copied}
			darkPreview={darkPreview}
			showVariants={showVariants}
			active={active}
			onSelect={onSelect}
			onCopy={onCopy}
			interactive={interactive}
		/>
	);
}

function RuntimeCatalogGridItem({
	id,
	mapsightIconId,
	copied,
	darkPreview,
	showVariants,
	active,
	onSelect,
	onCopy,
	interactive,
}: {
	id: string;
	mapsightIconId: string;
	copied: boolean;
	darkPreview: boolean;
	showVariants: boolean;
	active: boolean;
	onSelect?: (id: string) => void;
	onCopy: (id: string) => void;
	interactive: boolean;
}) {
	const {src, bitmap, loading} = useMapsightIcon(mapsightIconId);

	return (
		<CatalogGridItemShell
			id={id}
			copyId={mapsightIconId}
			copied={copied}
			darkPreview={darkPreview}
			active={active}
			onSelect={onSelect}
			onCopy={onCopy}
			interactive={interactive}
		>
			{showVariants ? (
				<div className="catalog-grid-item__variants">
					{VARIANTS.map((variant) => (
						<RuntimeVariantPreview
							key={variant}
							mapsightIconId={mapsightIconId}
							variant={variant}
						/>
					))}
				</div>
			) : src ? (
				<img
					src={src}
					alt=""
					width={bitmap?.logicalWidth ?? 40}
					height={bitmap?.logicalHeight ?? 40}
				/>
			) : (
				<span className="catalog-grid-item__placeholder">
					{loading ? "…" : ""}
				</span>
			)}
		</CatalogGridItemShell>
	);
}

function RuntimeVariantPreview({
	mapsightIconId,
	variant,
}: {
	mapsightIconId: string;
	variant: IconVariant;
}) {
	const {src, bitmap, loading} = useMapsightIcon(mapsightIconId, variant);

	return (
		<figure>
			{src ? (
				<img
					src={src}
					alt=""
					title={variant}
					width={bitmap?.logicalWidth ?? 40}
					height={bitmap?.logicalHeight ?? 40}
				/>
			) : (
				<span className="catalog-grid-item__placeholder">
					{loading ? "…" : ""}
				</span>
			)}
		</figure>
	);
}

function CatalogGridItemShell({
	id,
	copyId,
	copied,
	darkPreview,
	active,
	onSelect,
	onCopy,
	interactive,
	children,
}: {
	id: string;
	copyId: string;
	copied: boolean;
	darkPreview: boolean;
	active: boolean;
	onSelect?: (id: string) => void;
	onCopy: (id: string) => void;
	interactive: boolean;
	children: ReactNode;
}) {
	const groups = getCatalogIconGroups(id);
	const className = [
		"catalog-grid-item",
		active ? "is-active" : "",
		darkPreview ? "catalog-grid-item--dark" : "",
	]
		.filter(Boolean)
		.join(" ");
	const previewStyle = darkPreview
		? {
				backgroundColor: "#4b5563",
				borderColor: "#6b7280",
			}
		: {
				backgroundColor: "transparent",
				borderColor: "transparent",
			};
	const content = (
		<>
			<div className="catalog-grid-item__preview" style={previewStyle}>
				{children}
			</div>
			<span className="catalog-grid-item__id">{id}</span>
			{groups.length > 0 ? (
				<span className="catalog-grid-item__groups">
					{groups.join(" · ")}
				</span>
			) : null}
			{copied ? (
				<span className="catalog-grid-item__copied">Copied</span>
			) : null}
		</>
	);

	if (!interactive) {
		return (
			<button
				type="button"
				className={className}
				title={`Copy ${copyId}`}
				onClick={() => onCopy(copyId)}
			>
				{content}
			</button>
		);
	}

	return (
		<button
			type="button"
			className={className}
			onClick={() => {
				onSelect?.(id);
				onCopy(copyId);
			}}
			title={id}
		>
			{content}
		</button>
	);
}
