import throttle from "lodash/throttle";

export default function throttleDispatch<
	TParameters extends Array<unknown> = Array<unknown>,
>(dispatcher: (...args: TParameters) => void) {
	// we always want the newest update so trailing needs to be true and leading cannot be true
	return throttle(dispatcher, 300, {leading: false, trailing: true});
}
