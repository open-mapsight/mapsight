//import forEach from 'lodash/forEach';
//import {Action} from '@/types';
//import {baseReducer} from '@/lib/base/reducer';
import {BaseController} from "@/lib/base/controller";

export class FeatureSelectionsController extends BaseController {
	//reduce(state = {}, action: Action) {
	//	state = baseReducer(state, action);
	//
	//	// enforce limits
	//	const nextState = {};
	//	let changed = false;
	//	forEach(state, (featureSelection, id) => {
	//		if (featureSelection.max && featureSelection.features && featureSelection.features.length > featureSelection.max) {
	//			changed = true;
	//			featureSelection = {
	//				...featureSelection,
	//				filteredFeatures: featureSelection.features.slice(0, featureSelection.max),
	//			};
	//		}
	//
	//		nextState[id] = featureSelection;
	//	});
	//
	//	if (changed) {
	//		return nextState;
	//	}
	//
	//	return state;
	//}
}
