import {formatDistanceToNow} from "date-fns";

function TimeDistanceFromNow({date = new Date()}: {date?: Date}) {
	// TODO: i18n
	const label = formatDistanceToNow(date, {
		addSuffix: true,
		includeSeconds: true,
	});
	return (
		<span className="ms3-vector-editor-time-distance-from-now">
			{label}
		</span>
	);
}

export default TimeDistanceFromNow;
