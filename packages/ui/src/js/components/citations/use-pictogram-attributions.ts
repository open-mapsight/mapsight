import {useMemo} from "react";
import {useSelector} from "react-redux";

import {pictogramAttributionsFromIconIds} from "../../citations/pictogram-attributions";
import {citationIconIdsFromStateSelector} from "../../citations/selectors";
import {useHostCitationPictogramIds} from "./citation-pictogram-ids-context";

export function usePictogramAttributions() {
	const hostIds = useHostCitationPictogramIds();
	const stateIconIds = useSelector(citationIconIdsFromStateSelector);
	return useMemo(
		() => pictogramAttributionsFromIconIds([...hostIds, ...stateIconIds]),
		[hostIds, stateIconIds],
	);
}
