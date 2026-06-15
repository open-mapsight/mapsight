const env = import.meta.env;

export const legalDetails = {
	name: env.VITE_SHOWCASE_LEGAL_NAME ?? "Mapsight maintainer",
	addressLines: (
		env.VITE_SHOWCASE_LEGAL_ADDRESS ??
		"Address provided in the deployment environment"
	)
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean),
	email: env.VITE_SHOWCASE_LEGAL_EMAIL ?? "mapsight@example.invalid",
};
