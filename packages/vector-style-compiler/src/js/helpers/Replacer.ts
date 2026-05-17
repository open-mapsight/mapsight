const RE_FUNCTION_PARAMETER = "([^\\)]*?)";
const RE_DOUBLE_QUOTES_IN_PARIS_ONLY = '(?:(?:[^"]*"){2})*[^"]*$';
const TAG_DELIMITER = "%%%";

export type ReplacerFn = (
	match: string,
	parameter: string,
	replacer: Replacer,
) => string;

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
		const regex = new RegExp(
			`(${functionName}\\(${RE_FUNCTION_PARAMETER}\\))(?=${RE_DOUBLE_QUOTES_IN_PARIS_ONLY})`,
			"ig",
		);
		const fn = (value: string): string =>
			value.replace(regex, (match, _, parameter) => {
				const tag =
					TAG_DELIMITER + this.replacementCounter++ + TAG_DELIMITER;
				const replacement = replacer(match, parameter as string, this);
				this.replacements.push({tag, replacement});

				return tag;
			});
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
