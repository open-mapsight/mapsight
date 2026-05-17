export default function replaceRegex(
	regularExpressionSearch: string,
	replacement: string,
	subject: string,
) {
	return subject.replace(
		new RegExp(regularExpressionSearch, "g"),
		replacement,
	);
}
