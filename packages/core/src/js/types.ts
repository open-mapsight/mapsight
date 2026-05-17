import "@redux-devtools/extension";

import type {
	Feature as GeoJSONFeature,
	Geometry as GeoJSONGeometry,
} from "geojson";
import type {
	Action as ReduxAction,
	Reducer as ReduxReducer,
	Store as ReduxStore,
} from "redux";
import type {ThunkAction as BaseThunkAction, ThunkDispatch} from "redux-thunk";
import type {Selector as ReduxSelector} from "reselect";

import type {
	ObserveHandler as BaseObserveHandler,
	StoreExtControlledActions,
} from "@mapsight/lib-redux/enable-controlled-dispatch-and-observe";

import type {
	ASYNC_ACTION_FLAG,
	ActionPath,
	CONTROLLED_ACTION_FLAG,
	QUIET_ACTION_FLAG,
	STATE_PATH_KEY,
} from "@/lib/base/actions";
import type {BaseController} from "@/lib/base/controller";

export interface State {
	[key: string]: unknown;
}

export interface ActionMeta {
	[CONTROLLED_ACTION_FLAG]?: boolean;
	[QUIET_ACTION_FLAG]?: boolean;
	[ASYNC_ACTION_FLAG]?: boolean;
	[STATE_PATH_KEY]?: ActionPath;
	sanitized?: boolean;
}

export interface BaseAction extends ReduxAction {
	name?: string;
	meta?: ActionMeta;
	// eslint-disable-next-line
	[extraProps: string]: any; // TODO: Ideally we want to type all action props
}

export type Action = BaseAction | BatchedAction;

export type BatchedAction = BaseAction & {
	meta: {batch: true};
	payload: Array<Action>;
};

export type ThunkAction<
	TReturnType = unknown,
	TExtraThunkArg = unknown,
	TAction extends Action = Action,
	TState extends State = State,
> = BaseThunkAction<TReturnType, TState, TExtraThunkArg, TAction> & {
	meta?: {
		[ASYNC_ACTION_FLAG]?: boolean;
		[QUIET_ACTION_FLAG]?: boolean;
	};
};

export type ActionOrThunk<
	TAction extends Action = Action,
	TThunkAction extends ThunkAction = ThunkAction,
> = TAction | TThunkAction;

export type Reducer<
	TState extends State = State,
	TAction extends Action = Action,
> = ReduxReducer<TState, TAction>;

export type Selector<
	TValue = unknown,
	TState extends State = State,
> = ReduxSelector<TState, TValue>;

export type ObserveHandler<
	TValue = unknown,
	TState extends State = State,
> = BaseObserveHandler<TState, TValue>;

export type StoreExt = {
	getController: (name: string) => BaseController;
	dispatch: ThunkDispatch<State, unknown, Action>;
} & StoreExtControlledActions<State>;

export type EnhancedStore<TState extends State = State> = ReduxStore<
	TState,
	Action
> &
	StoreExt;

export type FeatureId = string;

export interface Feature extends GeoJSONFeature {
	id: string;
	properties: GeoJSONFeature["properties"] & {
		// TODO: Add properties
	};
}

export type Geometry = GeoJSONGeometry;
