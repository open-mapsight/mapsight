import {type MouseEvent, type ReactElement, memo, useCallback} from "react";
import Select, {type StylesConfig} from "react-select";

import {useMutation, useQueryClient} from "@tanstack/react-query";

import {usePresets} from "../../api/hooks.js";
import {parsePresetsResponse} from "../../config/platform.js";
import {useAppConfig} from "../../context/count-aggregator-provider.js";
import {useCountAggregatorPortal} from "../../context/count-aggregator-root.js";
import type {PresetData} from "../../types";
import {getSelectStyles} from "./station-select.js";

function PresetSelectItem({
	preset,
	onDelete,
	showDeleteButton,
}: {
	preset: PresetData;
	onDelete: (id: number) => void;
	showDeleteButton: boolean;
}): ReactElement {
	const handleDeleteClick = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			event.stopPropagation();
			onDelete(preset.id);
		},
		[onDelete, preset.id],
	);

	return (
		<div className="msca:flex msca:flex-row msca:gap-2 msca:text-sm">
			<span className="msca:grow">{preset.name}</span>
			<button
				type="button"
				onClick={handleDeleteClick}
				className="msca:rounded-full msca:border msca:border-gray-100 msca:bg-[var(--msca-color-surface)] msca:px-2 msca:text-gray-300 msca:hover:border-gray-400 msca:hover:text-gray-700"
				style={{
					visibility: showDeleteButton ? "visible" : "hidden",
				}}
				title="Voreinstellung löschen…"
			>
				X
			</button>
		</div>
	);
}

export const PresetSelect = memo(function PresetSelect({
	appId,
	onSet,
	allowAdd = true,
}: {
	appId: string;
	onSet: (preset: PresetData | null) => void;
	allowAdd?: boolean;
}): ReactElement | null {
	const presets = usePresets(appId);
	const queryClient = useQueryClient();
	const appConfig = useAppConfig(appId);
	const presetsEndpoint = appConfig.endpoints?.presets;
	const portalTarget = useCountAggregatorPortal();
	const presetsQueryKey = [
		"count-aggregator",
		appId,
		"presets",
		presetsEndpoint,
	] as const;

	const deletePreset = useMutation({
		mutationFn: async (presetId: number) => {
			if (presetsEndpoint === undefined) {
				throw new Error("Presets endpoint is not configured");
			}

			const response = await fetch(
				`${presetsEndpoint}/${encodeURIComponent(String(presetId))}`,
				{method: "DELETE", headers: {Accept: "application/json"}},
			);

			if (!response.ok) {
				throw new Error(
					`Preset delete failed with HTTP ${response.status}`,
				);
			}

			const presetData = parsePresetsResponse(await response.json());
			queryClient.setQueryData(presetsQueryKey, presetData);
			return presetData;
		},
	});

	const handleItemDeletion = useCallback(
		(id: number) => {
			deletePreset.mutate(id);
		},
		[deletePreset],
	);

	if (presets === undefined) {
		return null;
	}

	return (
		<Select
			isClearable
			placeholder="Voreinstellung…"
			options={presets}
			getOptionLabel={(preset) => preset.name}
			getOptionValue={(preset) => String(preset.id)}
			formatOptionLabel={(preset, {context}) => (
				<PresetSelectItem
					preset={preset}
					onDelete={handleItemDeletion}
					showDeleteButton={context === "menu" && allowAdd}
				/>
			)}
			onChange={(selected) => {
				onSet(selected as PresetData | null);
			}}
			styles={getSelectStyles() as unknown as StylesConfig<PresetData>}
			menuPortalTarget={portalTarget}
			menuPosition="fixed"
			noOptionsMessage={() => "Keine Voreinstellungen"}
			className="msca:min-w-[220px]"
		/>
	);
});
