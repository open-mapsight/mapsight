import type {MouseEvent, ReactNode} from "react";

import {useMapsightIcon} from "@mapsight/ui/hooks/useMapsightIcon";

import {
	type CountAggregatorDataViewRequestDetail,
	dispatchCountAggregatorDataViewRequest,
} from "../../events/data-view-request.js";
import {formatMetricDate} from "../lib/format-metric-values.js";

type Props = {
	label: ReactNode;
	mapsightIconId?: string;
	showMetricIcons?: boolean;
	children: ReactNode;
	lastUpdatedAt: Date | null;
	dataViewHref?: string;
	dataViewRequest?: CountAggregatorDataViewRequestDetail;
	dataViewLabel?: string;
	downloadWizardHref?: string;
	downloadWizardRequest?: CountAggregatorDataViewRequestDetail;
	downloadWizardLabel?: string;
};

function MetricIcon({id}: {id: string}) {
	const {src, error} = useMapsightIcon(id, "plain");

	if (src === null || error !== null) {
		return null;
	}

	return <img src={src} alt="" aria-hidden={true} />;
}

export default function MetricWidgetShell({
	label,
	mapsightIconId,
	showMetricIcons = false,
	children,
	lastUpdatedAt,
	dataViewHref,
	dataViewRequest,
	dataViewLabel = "Daten vergleichen",
	downloadWizardHref,
	downloadWizardRequest,
	downloadWizardLabel = "Daten herunterladen",
}: Props) {
	const handleRequestClick =
		(request: CountAggregatorDataViewRequestDetail | undefined) =>
		(event: MouseEvent<HTMLAnchorElement>) => {
			if (!request) {
				return;
			}

			if (
				dispatchCountAggregatorDataViewRequest(
					event.currentTarget,
					request,
				)
			) {
				event.preventDefault();
			}
		};

	const hasActions = dataViewHref || downloadWizardHref;

	function renderAction(
		href: string | undefined,
		label: string,
		request: CountAggregatorDataViewRequestDetail | undefined,
	) {
		if (!href) {
			return;
		}

		return (
			<a
				className="ms3-smart-city-metric__data-link"
				href={href}
				onClick={handleRequestClick(request)}
			>
				{label}
			</a>
		);
	}

	return (
		<section className="ms3-smart-city-metric">
			<header className="ms3-smart-city-metric__header">
				{showMetricIcons && mapsightIconId ? (
					<span className="ms3-smart-city-metric__icon">
						<MetricIcon id={mapsightIconId} />
					</span>
				) : null}
				<span className="ms3-smart-city-metric__label">{label}</span>
			</header>
			<div className="ms3-smart-city-metric__body">{children}</div>
			<footer className="ms3-smart-city-metric__footer">
				<span className="ms3-smart-city-metric__updated">
					{formatMetricDate(lastUpdatedAt)}
				</span>
				{hasActions ? (
					<span className="ms3-smart-city-metric__actions">
						{renderAction(
							dataViewHref,
							dataViewLabel,
							dataViewRequest,
						)}
						{renderAction(
							downloadWizardHref,
							downloadWizardLabel,
							downloadWizardRequest,
						)}
					</span>
				) : null}
			</footer>
		</section>
	);
}
