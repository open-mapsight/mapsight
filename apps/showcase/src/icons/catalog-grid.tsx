import type {ReactNode} from "react";

import {useMapsightIcon} from "@mapsight/ui/hooks/useMapsightIcon";

import type {CatalogSectionKind} from "./catalog-sections.ts";

function prebuiltIconSrc(id: string): string {
	return `/img/mapsight-icons-svg/${id}-default.svg`;
}

export function CatalogGrid({
	ids,
	kind,
	activeId = "",
	onSelect,
	showLabels = false,
}: {
	ids: string[];
	kind: CatalogSectionKind;
	activeId?: string;
	onSelect?: (id: string) => void;
	showLabels?: boolean;
}) {
	return (
		<div
			className={`catalog-grid${showLabels ? " catalog-grid--page" : ""}`}
		>
			{ids.map((id) => (
				<CatalogGridItem
					key={id}
					id={id}
					kind={kind}
					active={Boolean(activeId) && id === activeId}
					onSelect={onSelect}
					interactive={typeof onSelect === "function"}
				/>
			))}
		</div>
	);
}

function CatalogGridItem({
	id,
	kind,
	active,
	onSelect,
	interactive,
}: {
	id: string;
	kind: CatalogSectionKind;
	active: boolean;
	onSelect?: (id: string) => void;
	interactive: boolean;
}) {
	if (kind === "prebuilt") {
		return (
			<CatalogGridItemShell
				id={id}
				active={active}
				onSelect={onSelect}
				interactive={interactive}
			>
				<img src={prebuiltIconSrc(id)} alt="" width={48} height={48} />
			</CatalogGridItemShell>
		);
	}

	return (
		<RuntimeCatalogGridItem
			id={id}
			active={active}
			onSelect={onSelect}
			interactive={interactive}
		/>
	);
}

function RuntimeCatalogGridItem({
	id,
	active,
	onSelect,
	interactive,
}: {
	id: string;
	active: boolean;
	onSelect?: (id: string) => void;
	interactive: boolean;
}) {
	const {src, bitmap, loading} = useMapsightIcon(id);

	return (
		<CatalogGridItemShell
			id={id}
			active={active}
			onSelect={onSelect}
			interactive={interactive}
		>
			{src ? (
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

function CatalogGridItemShell({
	id,
	active,
	onSelect,
	interactive,
	children,
}: {
	id: string;
	active: boolean;
	onSelect?: (id: string) => void;
	interactive: boolean;
	children: ReactNode;
}) {
	const className = `catalog-grid-item${active ? " is-active" : ""}`;

	if (!interactive) {
		return (
			<div className={className} title={id}>
				{children}
				<span>{id}</span>
			</div>
		);
	}

	return (
		<button
			type="button"
			className={className}
			onClick={() => onSelect?.(id)}
			title={id}
		>
			{children}
			<span>{id}</span>
		</button>
	);
}
