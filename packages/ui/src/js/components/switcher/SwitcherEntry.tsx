import type {ElementType} from "react";
import {Fragment, memo} from "react";

import {
	type FeatureSourceStatus,
	STATUS_ERROR,
	STATUS_LOADING,
	STATUS_OK,
} from "@mapsight/core/lib/feature-sources/selectors";

import {translate} from "../../helpers/i18n";
import SwitcherButton from "./SwitcherButton";
import SwitcherStatusIcon from "./SwitcherStatusIcon";

type SwitcherEntryStatus = "active" | "inactive" | "error" | "loading";

export const STATUS_ACTIVE = "active";
export const STATUS_INACTIVE = "inactive";

const mapStatusClassName = (status: SwitcherEntryStatus) =>
	({
		[STATUS_ERROR]: "error",
		[STATUS_LOADING]: "loading",
		[STATUS_ACTIVE]: "active",
		[STATUS_INACTIVE]: "inactive",
	})[status];

const mapStatusLabel = (status: string) =>
	translate("ui.switcher.entry.label" + status);

const determineDisplayStatus = (
	status: FeatureSourceStatus,
	active: boolean,
): SwitcherEntryStatus => {
	if (!status || status === STATUS_OK) {
		return active ? STATUS_ACTIVE : STATUS_INACTIVE;
	}

	return status;
};

export type SwitcherEntryProps = {
	as?: ElementType;
	className?: string;
	baseClassName?: string;
	title: string;
	count?: number | null;
	toggleActive?: () => void;
	toggleActiveCheckbox?: () => void;
	toggleActiveText?: () => void;
	active?: boolean;
	activeCheckbox?: boolean;
	activeText?: boolean;
	status: FeatureSourceStatus;
	locked?: boolean;
};

function SwitcherEntry({
	as: T = "li",
	className = "",
	baseClassName = "ms3-layer-switcher__entry", // TODO: Use generic class name
	title,
	count = null,
	toggleActive,
	toggleActiveCheckbox: _toggleActiveCheckbox,
	toggleActiveText: _toggleActiveText,
	active,
	activeCheckbox: _activeCheckbox,
	activeText: _activeText,
	status,
	locked = false,
	...attributes
}: SwitcherEntryProps) {
	// `toggleActive` manages the "split" mode. If `toggleActive` isn't set we switch to the
	// "split" mode, it's enabling split active statuses and toggle handlers for the checkbox and
	// text.
	const isSplit = !toggleActive;
	const activeCheckbox = isSplit ? (_activeCheckbox ?? false) : active;
	const activeText = isSplit ? (_activeText ?? false) : active;
	const toggleActiveCheckbox = isSplit ? _toggleActiveCheckbox : undefined;
	const toggleActiveText = isSplit ? _toggleActiveText : undefined;

	const checkboxDisplayStatus = determineDisplayStatus(
		status,
		activeCheckbox ?? false,
	);
	const checkboxStatusClass = mapStatusClassName(checkboxDisplayStatus);
	const checkboxStatusLabel = mapStatusLabel(checkboxDisplayStatus);

	const checkbox = (
		<SwitcherStatusIcon
			status={checkboxStatusClass}
			onClick={!toggleActive && toggleActiveCheckbox}
			active={activeCheckbox}
		>
			{checkboxStatusLabel}
		</SwitcherStatusIcon>
	);

	const text = (
		<Fragment>
			<span className={`${baseClassName}__label`}>{title}</span>
			{!!count && (
				<span
					className={`${baseClassName}__count`}
					data-ms3-count={count}
				>
					{count}
				</span>
			)}
		</Fragment>
	);

	return (
		<T
			// TODO: remove checkboxStatusClass
			className={`${className} [ ${baseClassName} ${baseClassName}--${checkboxStatusClass} ${baseClassName}--${
				isSplit ? "split" : "joint"
			} ${locked ? `${baseClassName}--locked` : ""} ]`}
			{...attributes}
		>
			{(() => {
				if (toggleActive) {
					return (
						<SwitcherButton
							status={checkboxStatusClass}
							toggleActive={toggleActive}
							active={active}
						>
							{checkbox}
							{text}
						</SwitcherButton>
					);
				} else {
					const textDisplayStatus = determineDisplayStatus(
						status,
						activeText ?? false,
					);
					const textStatusClass =
						mapStatusClassName(textDisplayStatus);
					const textStatusLabel = mapStatusLabel(textDisplayStatus);

					return (
						<Fragment>
							{checkbox}
							<button
								type="button"
								role="checkbox"
								onClick={toggleActiveText}
								className={`${baseClassName}__text-button ${baseClassName}__text-button--${textStatusClass}`}
								aria-checked={activeText ? "true" : "false"}
								aria-label={textStatusLabel}
							>
								{text}
							</button>
						</Fragment>
					);
				}
			})()}
		</T>
	);
}

export default memo(SwitcherEntry);
