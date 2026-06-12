import {type ReactElement, memo} from "react";

import {useTrafficEvents} from "../../api/hooks.js";
import {useCountAggregatorConfig} from "../../context/count-aggregator-provider.js";
import {ymdToDate} from "../../lib/dates.js";
import {getDocumentLocale} from "../../lib/utils.js";
import type {TrafficEvent} from "../../types";

const dateFormatter = new Intl.DateTimeFormat(getDocumentLocale(), {
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
});

function EventEntry({
	event,
	eventUrl,
}: {
	event: TrafficEvent;
	eventUrl: (endDateYmd: string, eventId: number) => string;
}): ReactElement {
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
				? "(ganztägig)"
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
	const {data, error, isLoading, isSuccess} = useTrafficEvents(
		appId,
		startDate,
		endDate,
	);

	return (
		<div className="msca:text-sm">
			{error ? <p>Fehler beim abrufen…</p> : null}
			{isLoading ? <p>Lädt…</p> : null}
			{isSuccess && (data?.manualEvents.length ?? 0) === 0 ? (
				<p>Keine Einträge</p>
			) : null}
			{data?.manualEvents.map((event) => (
				<EventEntry
					key={event.id}
					event={event}
					eventUrl={links.eventUrl}
				/>
			))}
		</div>
	);
});
