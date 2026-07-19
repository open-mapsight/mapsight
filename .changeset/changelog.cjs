/**
 * Lean Changesets changelog helpers.
 * Collapses noisy per-changeset "Updated dependencies" lines into one
 * entry with old→new versions and bump kind.
 */

/** @param {string | undefined} commit */
function shortSha(commit) {
	return commit ? commit.slice(0, 7) : null;
}

/**
 * @type {import('@changesets/types').GetReleaseLine}
 */
async function getReleaseLine(changeset) {
	const [firstLine, ...futureLines] = changeset.summary
		.split("\n")
		.map((line) => line.trimEnd());

	let returnVal = `- ${changeset.commit ? `${shortSha(changeset.commit)}: ` : ""}${firstLine}`;

	if (futureLines.length > 0) {
		returnVal += `\n${futureLines.map((line) => `  ${line}`).join("\n")}`;
	}

	return returnVal;
}

/**
 * @type {import('@changesets/types').GetDependencyReleaseLine}
 */
async function getDependencyReleaseLine(changesets, dependenciesUpdated) {
	if (dependenciesUpdated.length === 0) {
		return "";
	}

	const shas = [
		...new Set(
			changesets
				.map((changeset) => shortSha(changeset.commit))
				.filter(Boolean),
		),
	];
	const shaSuffix =
		shas.length > 0
			? ` [${shas.map((sha) => `\`${sha}\``).join(", ")}]`
			: "";

	const lines = dependenciesUpdated.map(
		(dependency) =>
			`  - \`${dependency.name}@${dependency.oldVersion} → ${dependency.newVersion}\` (${dependency.type})`,
	);

	return [`- Updated dependencies${shaSuffix}:`, ...lines].join("\n");
}

module.exports = {
	getReleaseLine,
	getDependencyReleaseLine,
};
