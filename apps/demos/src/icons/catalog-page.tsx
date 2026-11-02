import {useEffect, useMemo, useState} from "react";

import {pickContrastForeground} from "@mapsight/traffic-style/runtime-dev";

import {CatalogGrid} from "./catalog-grid.tsx";
import {
	catalogGroups,
	catalogIconCount,
	catalogSections,
	getCatalogIconGroups,
} from "./catalog-sections.ts";
import {IconColorControls} from "./icon-color-controls.tsx";
import {DEFAULT_ICON_BACKGROUND} from "./map-config.ts";

export function CatalogPage() {
	const [background, setBackground] = useState(DEFAULT_ICON_BACKGROUND);
	const [foregroundOverride, setForegroundOverride] = useState("");
	const [previewBackground, setPreviewBackground] = useState(background);
	const [previewForegroundOverride, setPreviewForegroundOverride] =
		useState(foregroundOverride);
	const [showVariants, setShowVariants] = useState(false);
	const [darkPreview, setDarkPreview] = useState(false);
	const [search, setSearch] = useState("");
	const [groupFilter, setGroupFilter] = useState("all");

	const resolvedForeground =
		foregroundOverride || pickContrastForeground(background);
	const filteredSections = useMemo(() => {
		const query = search.trim().toLowerCase();

		return catalogSections.map((section) => ({
			...section,
			ids: section.ids.filter((id) => {
				const groups = getCatalogIconGroups(id);
				const matchesGroup =
					groupFilter === "all" || groups.includes(groupFilter);
				const matchesSearch =
					query.length === 0 ||
					id.toLowerCase().includes(query) ||
					groups.some((group) => group.toLowerCase().includes(query));

				return matchesGroup && matchesSearch;
			}),
		}));
	}, [groupFilter, search]);
	const prebuiltSection = filteredSections.find(
		(section) => section.kind === "prebuilt",
	);
	const runtimeSections = filteredSections.filter(
		(section) => section.kind !== "prebuilt",
	);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			setPreviewBackground(background);
			setPreviewForegroundOverride(foregroundOverride);
		}, 180);

		return () => window.clearTimeout(timer);
	}, [background, foregroundOverride]);

	return (
		<div className="icon-route icon-route--catalog catalog-page">
			<aside className="catalog-sidebar">
				<header className="catalog-page__header">
					<h1>Icon catalog</h1>
					<p>
						{catalogIconCount} icons across prebuilt traffic
						sprites, traffic-style pictograms, and Font Awesome
						pictograms.
					</p>
				</header>

				<div className="catalog-controls" aria-label="Catalog controls">
					<div className="catalog-controls__filters">
						<label>
							Search
							<input
								type="search"
								value={search}
								placeholder="Type an id or group"
								onChange={(event) =>
									setSearch(event.target.value)
								}
							/>
						</label>
						<label>
							Group
							<select
								value={groupFilter}
								onChange={(event) =>
									setGroupFilter(event.target.value)
								}
							>
								<option value="all">All groups</option>
								{catalogGroups.map((group) => (
									<option key={group} value={group}>
										{group}
									</option>
								))}
							</select>
						</label>
					</div>

					<fieldset className="catalog-options">
						<legend>Options</legend>
						<label className="catalog-toggle">
							<input
								type="checkbox"
								checked={showVariants}
								onChange={(event) =>
									setShowVariants(event.target.checked)
								}
							/>
							Show all variants
						</label>
						<label className="catalog-toggle">
							<input
								type="checkbox"
								checked={darkPreview}
								onChange={(event) =>
									setDarkPreview(event.target.checked)
								}
							/>
							Dark preview
						</label>
					</fieldset>
				</div>

				<div className="catalog-runtime-controls">
					<h2>Styling</h2>
					<p>
						These colors apply to traffic-style and Font Awesome
						pictograms composed in the browser.
					</p>
					<IconColorControls
						background={background}
						foreground={resolvedForeground}
						foregroundIsAuto={foregroundOverride === ""}
						onBackgroundChange={setBackground}
						onBackgroundReset={() =>
							setBackground(DEFAULT_ICON_BACKGROUND)
						}
						onForegroundChange={setForegroundOverride}
						onForegroundReset={() => setForegroundOverride("")}
					/>
				</div>
			</aside>

			<div className="catalog-content">
				{prebuiltSection ? (
					<CatalogSectionView
						section={prebuiltSection}
						background={previewBackground}
						foregroundOverride={previewForegroundOverride || null}
						darkPreview={darkPreview}
						showVariants={showVariants}
					/>
				) : null}

				{runtimeSections.map((section) => (
					<CatalogSectionView
						key={section.id}
						section={section}
						background={previewBackground}
						foregroundOverride={previewForegroundOverride || null}
						darkPreview={darkPreview}
						showVariants={showVariants}
					/>
				))}
			</div>
		</div>
	);
}

function CatalogSectionView({
	section,
	background,
	foregroundOverride,
	darkPreview,
	showVariants,
}: {
	section: (typeof catalogSections)[number];
	background: string;
	foregroundOverride: string | null;
	darkPreview: boolean;
	showVariants: boolean;
}) {
	return (
		<section className="catalog-section">
			<h2>
				{section.title}{" "}
				<span className="catalog-section__count">
					({section.ids.length})
				</span>
			</h2>
			<p>{section.description}</p>
			{section.ids.length > 0 ? (
				<CatalogGrid
					ids={section.ids}
					kind={section.kind}
					background={background}
					foregroundOverride={foregroundOverride}
					darkPreview={darkPreview}
					showVariants={showVariants}
					showLabels
				/>
			) : (
				<p className="catalog-section__empty">No icons match.</p>
			)}
		</section>
	);
}
