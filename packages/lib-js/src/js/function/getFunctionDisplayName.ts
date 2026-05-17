// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export default function getFunctionDisplayName(f: Function): string {
	return f.displayName ?? f.name;
}
