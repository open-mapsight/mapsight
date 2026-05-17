export default function isNumberLike(a: unknown) {
	const float = parseFloat(a as string);
	return !isNaN(float) && String(float) === String(a);
}
