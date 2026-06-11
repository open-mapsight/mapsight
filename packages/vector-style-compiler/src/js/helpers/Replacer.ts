const TAG_DELIMITER = "%%%";

export type ReplacerFn = (
	match: string,
	parameter: string,
	replacer: Replacer,
) => string;

function findBalancedParameterEnd(
	value: string,
	openParenIndex: number,
): number {
	let depth = 0;
	let inString = false;
	let stringChar = "";

	for (let i = openParenIndex; i < value.length; i++) {
		const char = value[i]!;

		if (inString) {
			if (char === stringChar && value[i - 1] !== "\\") {
				inString = false;
			}
			continue;
		}

		if (char === `"` || char === `'`) {
			inString = true;
			stringChar = char;
			continue;
		}

		if (char === "(") {
			depth += 1;
			continue;
		}

		if (char === ")") {
			depth -= 1;
			if (depth === 0) {
				return i;
			}
		}
	}

	return -1;
}

export default class Replacer {
	private replacementCounter: number = 0;
	private replacements: Array<{tag: string; replacement: string}> = [];
	private functions: Array<(val: string) => string> = [];

	constructor(functions: Array<[string, ReplacerFn]> = []) {
		functions.forEach(([functionName, replacer]) =>
			this.addFunction(functionName, replacer),
		);
	}

	addFunction(functionName: string, replacer: ReplacerFn) {
		const fn = (value: string): string => {
			const pattern = new RegExp(`\\b${functionName}\\(`, "ig");
			let result = "";
			let cursor = 0;
			let match: RegExpExecArray | null;

			while ((match = pattern.exec(value)) !== null) {
				const openParenIndex = match.index + match[0].length - 1;
				const closeParenIndex = findBalancedParameterEnd(
					value,
					openParenIndex,
				);

				if (closeParenIndex === -1) {
					continue;
				}

				result += value.slice(cursor, match.index);
				const fullMatch = value.slice(match.index, closeParenIndex + 1);
				const parameter = value.slice(
					openParenIndex + 1,
					closeParenIndex,
				);
				const tag =
					TAG_DELIMITER + this.replacementCounter++ + TAG_DELIMITER;
				const replacement = replacer(fullMatch, parameter, this);
				this.replacements.push({tag, replacement});
				result += tag;
				cursor = closeParenIndex + 1;
				pattern.lastIndex = cursor;
			}

			return result + value.slice(cursor);
		};

		this.functions.push(fn);
	}

	execute(value: string): string {
		return this.functions.reduce((acc, fn) => fn(acc), value);
	}

	replace(value: string): string {
		return this.replacements.reduceRight(
			(acc, {tag, replacement}) =>
				acc.replace(new RegExp(tag, "g"), replacement),
			value,
		);
	}
}
