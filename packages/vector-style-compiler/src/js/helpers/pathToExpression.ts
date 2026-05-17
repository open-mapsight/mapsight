export default function pathToExpression(target: string, path: string[]) {
	return path.length > 1
		? `get(${target}, [${path.map((a) => `'${a}'`).join(", ")}])`
		: `${target}['${path[0]}']`;
}
