import {Link} from "react-router-dom";

const sections = [
	{
		to: "/ui/combined-list",
		title: "Demos",
		description:
			"Mapsight UI examples — combined list, simple map, full layout, custom overlays, and router integration.",
	},
	{
		to: "/count-aggregator",
		title: "Count aggregator",
		description:
			"Embeddable stepped wizard and a headless custom-UI demo against a mock count-aggregator API — no live tenant required.",
	},
	{
		to: "/icons",
		title: "Icons",
		description:
			"Runtime icon editor and catalog — compose pictograms on a map or browse prebuilt sprites and Font Awesome pictograms.",
	},
] as const;

export function LandingPage() {
	return (
		<div className="showcase-page landing msb-content">
			<div className="showcase-page__hero">
				<p className="msb-eyebrow">Mapsight / Showcase</p>
				<h1>Maps that fit your site.</h1>
				<p className="msb-intro">
					An open-source framework for communicative web maps,
					designed to take on the look of the page they sit on.
				</p>
				<p className="msb-status">
					Work in progress; used in controlled production deployments,
					not yet turnkey.
				</p>
			</div>

			<div className="landing__grid">
				{sections.map((section) => (
					<Link
						key={section.to}
						to={section.to}
						className="landing__card"
					>
						<h2>{section.title}</h2>
						<p>{section.description}</p>
						<span className="landing__card-link">Open →</span>
					</Link>
				))}
			</div>
		</div>
	);
}
