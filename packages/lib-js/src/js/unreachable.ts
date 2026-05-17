export function unreachable(msg: string = "Reached an unreachable"): never {
	throw new Error(msg);
}

export function unreachableValue(
	val: never,
	msg: string = "Reached an unreachable",
): never {
	throw new Error(`${msg} with value "${JSON.stringify(val)}"`);
}
