function isCharacterEscaped(source: string, index: number): boolean {
	let backslashCount = 0;
	for (let j = index - 1; j >= 0 && source[j] === "\\"; j--) {
		backslashCount += 1;
	}
	return backslashCount % 2 === 1;
}

function findClosingQuote(source: string, openIndex: number): number {
	const stringChar = source[openIndex]!;
	for (let i = openIndex + 1; i < source.length; i++) {
		if (source[i] === stringChar && !isCharacterEscaped(source, i)) {
			return i;
		}
	}
	return -1;
}

function scanWithStringAwareness(
	source: string,
	openIndex: number,
	openChar: string,
	closeChar: string,
): number {
	let depth = 0;
	let inString = false;
	let stringChar = "";

	for (let i = openIndex; i < source.length; i++) {
		const char = source[i]!;

		if (inString) {
			if (char === stringChar && !isCharacterEscaped(source, i)) {
				inString = false;
			}
			continue;
		}

		if (char === "'" || char === '"') {
			inString = true;
			stringChar = char;
			continue;
		}

		if (char === openChar) {
			depth += 1;
			continue;
		}

		if (char === closeChar) {
			depth -= 1;
			if (depth === 0) {
				return i;
			}
		}
	}

	return -1;
}

function findClosingBracket(source: string, openIndex: number): number {
	return scanWithStringAwareness(source, openIndex, "[", "]");
}

function findClosingParen(source: string, openIndex: number): number {
	return scanWithStringAwareness(source, openIndex, "(", ")");
}

/**
 * Split `[name=value]` content on the first `=` outside of quoted strings.
 */
export function splitAttributeSelectorContent(
	content: string,
): [string, string | undefined] {
	let inString = false;
	let stringChar = "";

	for (let i = 0; i < content.length; i++) {
		const char = content[i]!;

		if (inString) {
			if (char === stringChar && !isCharacterEscaped(content, i)) {
				inString = false;
			}
			continue;
		}

		if (char === "'" || char === '"') {
			inString = true;
			stringChar = char;
			continue;
		}

		if (char === "=") {
			return [content.slice(0, i).trim(), content.slice(i + 1).trim()];
		}
	}

	return [content.trim(), undefined];
}

/**
 * Tokenize a Mapsight style selector into parts such as `#features`,
 * `[state="hover"]`, `:not(...)`, and `.group`.
 */
export default function tokenizeSelector(selector: string): string[] {
	const parts: string[] = [];
	let index = 0;

	while (index < selector.length) {
		if (/\s/.test(selector[index]!)) {
			index += 1;
			continue;
		}

		const char = selector[index]!;

		if (char === "'" || char === '"') {
			const end = findClosingQuote(selector, index);
			if (end === -1) {
				throw new Error(`Unterminated string in selector: ${selector}`);
			}
			parts.push(selector.slice(index, end + 1));
			index = end + 1;
			continue;
		}

		if (char === "[") {
			const end = findClosingBracket(selector, index);
			if (end === -1) {
				throw new Error(
					`Unterminated attribute selector in: ${selector}`,
				);
			}
			parts.push(selector.slice(index, end + 1));
			index = end + 1;
			continue;
		}

		if (char === ":" && selector.startsWith(":not(", index)) {
			const openParenIndex = index + 4;
			const end = findClosingParen(selector, openParenIndex);
			if (end === -1) {
				throw new Error(`Unterminated :not() in selector: ${selector}`);
			}
			parts.push(selector.slice(index, end + 1));
			index = end + 1;
			continue;
		}

		const match = /^\S+/.exec(selector.slice(index));
		if (match) {
			parts.push(match[0]);
			index += match[0].length;
			continue;
		}

		index += 1;
	}

	return parts;
}
