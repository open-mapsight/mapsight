import {memo} from "react";

import type {UseQueryResult} from "@tanstack/react-query";

import AsyncStatusRegion from "../components/async-status/AsyncStatusRegion";
import type {AsyncStatusRegionProps} from "../components/async-status/AsyncStatusRegion";
import {queryResultToView} from "./query-result-to-view";

export type QueryStatusRegionProps<T> = Omit<
	AsyncStatusRegionProps<T>,
	"view"
> & {
	query: UseQueryResult<T>;
};

function QueryStatusRegion<T>({
	query,
	...regionProps
}: QueryStatusRegionProps<T>) {
	return (
		<AsyncStatusRegion view={queryResultToView(query)} {...regionProps} />
	);
}

export default memo(QueryStatusRegion) as typeof QueryStatusRegion;
