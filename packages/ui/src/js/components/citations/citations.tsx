import type {ReactNode} from "react";

import Attribution from "../map-overlay/attribution";
import Legend from "../map-overlay/legend";
import {
	CitationPictogramIdsContext,
	useHostCitationPictogramIds,
} from "./citation-pictogram-ids-context";

export type CitationsProps = {
	hostPictogramIds?: readonly string[];
	datasetLicenses?: ReactNode;
	projectNotice?: ReactNode;
	hostCopyright?: ReactNode;
};

export default function Citations({
	hostPictogramIds,
	datasetLicenses,
	projectNotice,
	hostCopyright,
}: CitationsProps) {
	const contextHostIds = useHostCitationPictogramIds();
	const hostIds = hostPictogramIds ?? contextHostIds;

	return (
		<CitationPictogramIdsContext.Provider value={hostIds}>
			<div className="ms3-citations">
				<Attribution />
				<Legend />
				{datasetLicenses}
				{projectNotice}
				{hostCopyright}
			</div>
		</CitationPictogramIdsContext.Provider>
	);
}
