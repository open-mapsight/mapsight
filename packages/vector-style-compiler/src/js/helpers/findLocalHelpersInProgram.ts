/**
 * Helper functions the generated program may call. Each one has a region in
 * `template.source.js` (`helper-<name>`), which is kept only when it is used.
 */
export const LOCAL_HELPER_NAMES = ["get", "replace"] as const;

export type LocalHelperName = (typeof LOCAL_HELPER_NAMES)[number];

/**
 * Finds the local helpers a generated program calls. Method calls such as
 * `value.replace(` do not count.
 */
export default function findLocalHelpersInProgram(
	program: string,
): LocalHelperName[] {
	return LOCAL_HELPER_NAMES.filter((name) =>
		new RegExp(`(?<![\\w$.])${name}\\s*\\(`).test(program),
	);
}
