export const COUNT_AGGREGATOR_DATA_VIEW_REQUEST_EVENT =
	"count-aggregator:data-view-request";

export type CountAggregatorDataViewRequestDetail = {
	stationType: string;
	stationIds?: readonly number[];
	mode?: "wizard" | "comparison";
};

export function dispatchCountAggregatorDataViewRequest(
	target: EventTarget,
	detail: CountAggregatorDataViewRequestDetail,
): boolean {
	const event = new CustomEvent<CountAggregatorDataViewRequestDetail>(
		COUNT_AGGREGATOR_DATA_VIEW_REQUEST_EVENT,
		{
			bubbles: true,
			cancelable: true,
			composed: true,
			detail,
		},
	);

	target.dispatchEvent(event);
	return event.defaultPrevented;
}
