import type {RootStyleDeclaration} from "../index";

export default function declarationToGeometry(
	declaration?: RootStyleDeclaration,
) {
	return declaration?.geometry?.value || null;
}
