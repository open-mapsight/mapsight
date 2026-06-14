import type {ReactNode} from "react";

import {useMapsightIcon} from "@mapsight/ui/hooks/useMapsightIcon";

import {formatMetricDate} from "../lib/format-metric-values.js";

type Props = {
	label: ReactNode;
	mapsightIconId?: string;
	showMetricIcons?: boolean;
	children: ReactNode;
	lastUpdatedAt: Date | null;
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
}: Props) {
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
			</footer>
		</section>
	);
}
