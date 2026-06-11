import {useEffect, useMemo, useState} from "react";
import {useDispatch} from "react-redux";
import {useSearchParams} from "react-router-dom";

import {
	buildCatalogTargets,
	defaultIconCache,
	listPictogramIds,
	parseMapsightIcon,
	pickContrastForeground,
	prewarmCatalog,
} from "@mapsight/traffic-style/runtime-dev";
import Instance from "@mapsight/ui/components/instance";
import Map from "@mapsight/ui/components/map";
import MapWrapper from "@mapsight/ui/components/map-wrapper";
import {FEATURE_SOURCES} from "@mapsight/ui/config/constants/controllers";

import {updateFeatureProperty} from "@mapsight/core/lib/feature-sources/actions";

import {
	ICON_BACKGROUND_PALETTE,
	ICON_FOREGROUND_PALETTE,
} from "./icon-color-palette.ts";
import {IconColorPicker} from "./icon-color-picker.tsx";
import {IconPreview} from "./icon-preview.tsx";
import {
	DEFAULT_ICON_BACKGROUND,
	EDITOR_PREVIEW_FEATURE_ID,
	buildMapsightIcon,
	createBaseMapsightConfig,
	createOptions,
	formatEditorPreviewFeatureJson,
	styleFunction,
} from "./map-config.ts";

const pictogramIds = listPictogramIds();

type IconContentMode = "pictogram" | "label";

export function EditorPage() {
	const [searchParams] = useSearchParams();
	const plainMap = searchParams.get("plainMap") === "1";
	const baseMapsightConfig = useMemo(
		() => createBaseMapsightConfig({plainMap}),
		[plainMap],
	);

	return (
		<Instance
			baseMapsightConfig={baseMapsightConfig}
			createOptions={createOptions}
			styleFunction={styleFunction}
		>
			<EditorPageContent plainMap={plainMap} />
		</Instance>
	);
}

function EditorPageContent({plainMap}: {plainMap: boolean}) {
	const dispatch = useDispatch();
	const [contentMode, setContentMode] =
		useState<IconContentMode>("pictogram");
	const [pictogram, setPictogram] = useState(pictogramIds[0] ?? "fa-marker");
	const [label, setLabel] = useState("");
	const [background, setBackground] = useState(DEFAULT_ICON_BACKGROUND);
	const [foregroundOverride, setForegroundOverride] = useState<string | null>(
		null,
	);
	const [stats, setStats] = useState(defaultIconCache.getStats());
	const [prewarmed, setPrewarmed] = useState<number | null>(null);

	const foregroundIsAuto = foregroundOverride === null;
	const resolvedForeground =
		foregroundOverride ?? pickContrastForeground(background);

	const mapsightIconId = useMemo(
		() =>
			buildMapsightIcon({
				pictogram: contentMode === "pictogram" ? pictogram : "",
				label: contentMode === "label" ? label : "",
				background,
				foregroundOverride,
			}),
		[contentMode, pictogram, label, background, foregroundOverride],
	);

	const previewSpec = useMemo(
		() => parseMapsightIcon(mapsightIconId),
		[mapsightIconId],
	);

	const editorFeatureJson = useMemo(
		() => formatEditorPreviewFeatureJson(mapsightIconId),
		[mapsightIconId],
	);

	useEffect(() => {
		dispatch(
			updateFeatureProperty(
				FEATURE_SOURCES,
				"data",
				EDITOR_PREVIEW_FEATURE_ID,
				"mapsightIconId",
				mapsightIconId,
				undefined,
			),
		);
	}, [dispatch, mapsightIconId]);

	useEffect(() => {
		const timer = window.setInterval(() => {
			setStats(defaultIconCache.getStats());
		}, 400);
		return () => window.clearInterval(timer);
	}, []);

	useEffect(() => {
		const idle = window.requestIdleCallback?.(
			() => {
				void prewarmCatalog(
					defaultIconCache,
					buildCatalogTargets({variants: ["default", "plain"]}),
				).then((count) => setPrewarmed(count));
			},
			{timeout: 2000},
		);
		return () => {
			if (idle) {
				window.cancelIdleCallback(idle);
			}
		};
	}, []);

	return (
		<div
			className={`icon-route icon-route--editor app${plainMap ? " icon-route--plain-map" : ""}`}
		>
			<aside className="panel">
				<h1>@mapsight/traffic-style/runtime-dev</h1>
				<p>
					Compose a runtime icon and copy the resulting{" "}
					<code>mapsightIconId</code>. The map mixes classic sprites,
					default runtime icons, colored runtime icons, and your live
					editor preview feature.
				</p>

				<div className="field">
					<span className="field__label">Icon content</span>
					<div
						className="mode-toggle"
						role="group"
						aria-label="Icon content"
					>
						<button
							type="button"
							className={`mode-toggle__btn${contentMode === "pictogram" ? " is-active" : ""}`}
							aria-pressed={contentMode === "pictogram"}
							onClick={() => setContentMode("pictogram")}
						>
							Pictogram
						</button>
						<button
							type="button"
							className={`mode-toggle__btn${contentMode === "label" ? " is-active" : ""}`}
							aria-pressed={contentMode === "label"}
							onClick={() => setContentMode("label")}
						>
							Label
						</button>
					</div>
				</div>

				{contentMode === "pictogram" ? (
					<div className="field">
						<label htmlFor="pictogram">Pictogram</label>
						<select
							id="pictogram"
							value={pictogram}
							onChange={(event) =>
								setPictogram(event.target.value)
							}
						>
							{pictogramIds.map((id) => (
								<option key={id} value={id}>
									{id}
								</option>
							))}
						</select>
					</div>
				) : (
					<div className="field">
						<label htmlFor="label">Label (max 2 chars)</label>
						<input
							id="label"
							value={label}
							maxLength={2}
							onChange={(event) => setLabel(event.target.value)}
							placeholder="e.g. A1"
						/>
					</div>
				)}

				<div className="color-row">
					<IconColorPicker
						id="background"
						label="Background"
						value={background}
						palette={ICON_BACKGROUND_PALETTE}
						onChange={setBackground}
						onReset={() => setBackground(DEFAULT_ICON_BACKGROUND)}
						resetDisabled={background === DEFAULT_ICON_BACKGROUND}
					/>
					<IconColorPicker
						id="foreground"
						label={
							<>
								Foreground
								{foregroundIsAuto ? (
									<span className="field__hint"> (auto)</span>
								) : null}
							</>
						}
						value={resolvedForeground}
						palette={ICON_FOREGROUND_PALETTE}
						onChange={setForegroundOverride}
						onReset={() => setForegroundOverride(null)}
						resetDisabled={foregroundIsAuto}
						note={
							foregroundIsAuto
								? "Contrast is picked automatically from the background."
								: undefined
						}
					/>
				</div>

				<div className="output-card">
					<div className="output-card__header">
						<strong>mapsightIconId</strong>
						<span className="output-card__hint">
							Feature property value
						</span>
					</div>
					<div className="id-output" aria-live="polite">
						{mapsightIconId || (
							<span className="id-output__empty">
								Add a pictogram or label to generate an id
							</span>
						)}
					</div>
					<div className="output-card__subheader">
						<strong>GeoJSON feature</strong>
						<span className="output-card__hint">
							Rendered on the map
						</span>
					</div>
					<pre className="geojson-output">
						<code>{editorFeatureJson}</code>
					</pre>
				</div>

				<div className="preview-card">
					<strong>Live preview (all variants)</strong>
					{previewSpec ? <IconPreview spec={previewSpec} /> : null}
				</div>

				<div className="stats">
					<div>
						Cache: {stats.size} entries, {stats.hits} hits,{" "}
						{stats.misses} misses
					</div>
					{prewarmed !== null ? (
						<div>Idle prewarm: {prewarmed} catalog icons</div>
					) : null}
				</div>
			</aside>

			<div className="map-pane">
				<MapWrapper>
					<Map />
				</MapWrapper>
			</div>
		</div>
	);
}
