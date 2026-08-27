import {
	type CountAggregatorLocale,
	resolveCountAggregatorLocale,
} from "../../lib/i18n.js";
import {getDocumentLocale} from "../../lib/utils.js";
import {
	formatWindDirection,
	normalizeWindDegrees,
} from "../../lib/wind-direction.js";

type Props = {
	degrees: number;
	locale?: CountAggregatorLocale;
};

export default function WindDirectionDisplay({degrees, locale}: Props) {
	const resolvedLocale =
		locale ?? resolveCountAggregatorLocale(getDocumentLocale());
	const normalized = normalizeWindDegrees(degrees);
	if (normalized === undefined) {
		return null;
	}

	const label = formatWindDirection(normalized, resolvedLocale);

	return (
		<div className="ms3-smart-city-metric__wind">
			<div
				className="ms3-smart-city-metric__wind-compass"
				role="img"
				aria-label={label}
			>
				<span className="ms3-smart-city-metric__wind-cardinal ms3-smart-city-metric__wind-cardinal--n">
					N
				</span>
				<span className="ms3-smart-city-metric__wind-cardinal ms3-smart-city-metric__wind-cardinal--e">
					{resolvedLocale === "de" ? "O" : "E"}
				</span>
				<span className="ms3-smart-city-metric__wind-cardinal ms3-smart-city-metric__wind-cardinal--s">
					S
				</span>
				<span className="ms3-smart-city-metric__wind-cardinal ms3-smart-city-metric__wind-cardinal--w">
					W
				</span>
				<span
					className="ms3-smart-city-metric__wind-needle"
					style={{transform: `rotate(${normalized}deg)`}}
				/>
			</div>
			<div className="ms3-smart-city-metric__wind-label">{label}</div>
		</div>
	);
}
