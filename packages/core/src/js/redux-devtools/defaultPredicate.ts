import type {EnhancerOptions} from "@redux-devtools/extension";

import {QUIET_ACTION_FLAG} from "@/lib/base/actions";
import type {Action, State} from "@/types";

const defaultPredicate: EnhancerOptions["predicate"] = <
	S = State,
	A extends Action = Action,
>(
	state: S,
	action: A,
): boolean => {
	// we ignore "quiet" actions in the devtools log
	return !(action.meta && action.meta[QUIET_ACTION_FLAG]);
};
export default defaultPredicate;
