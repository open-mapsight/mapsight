import {type ReactElement, memo} from "react";

import {useTrafficEvents} from "../../api/hooks.js";
import {
	useCountAggregatorConfig,
	useCountAggregatorI18n,
} from "../../context/count-aggregator-provider.js";
import {ymdToDate} from "../../lib/dates.js";
import type {TrafficEvent} from "../../types";

function EventEntry({
	event,
	eventUrl,
	locale,
	allDayLabel,
}: {
	event: TrafficEvent;
	eventUrl: (endDateYmd: string, eventId: number) => string;
	locale: string;
	allDayLabel: string;
}): ReactElement {
	const dateFormatter = new Intl.DateTimeFormat(locale, {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});

	return (
		<a
			href={eventUrl(event.end_date, event.id)}
			className="msp-count-aggregator-event"
		>
			{dateFormatter.formatRange(
				ymdToDate(event.start_date),
				ymdToDate(event.end_date),
			)}{" "}
			- {event.title}{" "}
			{event.full_day
				? allDayLabel
				: `${event.start_time} - ${event.end_time}`}
		</a>
	);
}

export const Events = memo(function Events({
	appId,
	startDate,
	endDate,
}: {
	appId: string;
	startDate: Date | null;
	endDate: Date | null;
}): ReactElement {
	const {links} = useCountAggregatorConfig();
	const {locale, t} = useCountAggregatorI18n();
	const {data, error, isLoading, isSuccess} = useTrafficEvents(
		appId,
		startDate,
		endDate,
	);

	return (
		<div className="msca:text-sm">
			{error ? <p>{t("events.error")}</p> : null}
			{isLoading ? <p>{t("events.loading")}</p> : null}
			{isSuccess && (data?.manualEvents.length ?? 0) === 0 ? (
				<p>{t("events.empty")}</p>
			) : null}
			{data?.manualEvents.map((event) => (
				<EventEntry
					key={event.id}
					event={event}
					eventUrl={links.eventUrl}
					locale={locale}
					allDayLabel={t("events.allDay")}
				/>
			))}
		</div>
	);
});
