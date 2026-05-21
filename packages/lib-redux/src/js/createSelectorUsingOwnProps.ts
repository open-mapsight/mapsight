function strictEqualityComparison<T>(a: T, b: T): boolean {
	return a === b;
}

export type SelectorUsingPropsOptions = {
	equals?: typeof strictEqualityComparison;
};

type OwnPropsSelector<OwnProps, T = unknown> = (ownProps: OwnProps) => T;

type SelectorWithOwnProps<
	OwnProps extends Array<unknown> = Array<unknown>,
	State = unknown,
	Value = unknown,
> = (state: State, ownProps: OwnProps) => Value;
type SelectorFactory<
	OwnProps extends Array<unknown> = Array<unknown>,
	State = unknown,
	Value = unknown,
> = (
	...selectedValues: unknown[]
) => SelectorWithOwnProps<OwnProps, State, Value>;

/**
 * Create a selector whenever some (own) properties change. To be used with react-redux's connect() mapState.
 *
 * @param ownPropsSelectorOrSelectors one selector function or an array of selector functions that receive
 *                           the ownProps and should return one property value that will be used to determine changes
 * @param selectorFactory factory function receives the selected props as arguments followed by the state and
 *                           ownProps at the time of invalidation
 * @param [options] optional options
 * @param [options.equals] function that check equality, defaults to strict equality (===)
 * @returns selector function to be used as mapState in react-redux's connect() function.
 *                 May be combined with createSelector or any other function as
 *                 long as the selector is called with state as first and own props as second argument.
 */
export default function createSelectorUsingOwnProps<
	State = unknown,
	Value = unknown,
	OwnProps extends Array<unknown> = Array<unknown>,
>(
	ownPropsSelectorOrSelectors:
		| OwnPropsSelector<OwnProps>
		| Array<OwnPropsSelector<OwnProps>>,
	selectorFactory: SelectorFactory<OwnProps, State, Value>,
	options: SelectorUsingPropsOptions = {},
) {
	const equals = options.equals || strictEqualityComparison;
	let propsCache: Array<unknown>;
	let cachedSelector: SelectorWithOwnProps<OwnProps, State, Value>;

	const ownPropsSelectors = Array.isArray(ownPropsSelectorOrSelectors)
		? ownPropsSelectorOrSelectors
		: [ownPropsSelectorOrSelectors];

	function updateSelector(state: State, ownProps: OwnProps) {
		let hasChanged = false;

		if (!propsCache) {
			propsCache = new Array(ownPropsSelectorOrSelectors.length);
			hasChanged = true;
		}

		ownPropsSelectors.forEach(function updateProps(ownPropsSelector, i) {
			const prev = propsCache[i];
			const next = ownPropsSelector(ownProps);

			if (!hasChanged && !equals(prev, next)) {
				hasChanged = true;
			}

			propsCache[i] = next;
		});

		if (hasChanged || !cachedSelector) {
			cachedSelector = selectorFactory(...propsCache, state, ownProps);
		}
	}

	return function selector(state: State, ownProps: OwnProps): Value {
		updateSelector(state, ownProps);
		return cachedSelector(state, ownProps);
	};
}
