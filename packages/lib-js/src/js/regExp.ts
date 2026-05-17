export function escapeRegExp(value: string): string {
	// https://stackoverflow.com/a/6969486/5572146
	// $& means the whole matched string
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export {escapeRegExp as escape};

export function escapeRegExpReplace(value: string): string {
	// https://stackoverflow.com/a/6969486/5572146
	return value.replace(/\$/g, "$$$$");
}

export {escapeRegExpReplace as escapeReplace};
