import {Link} from "react-router-dom";

const sections = [
	{
		to: "/ui/combined-list",
		title: "Demos",
		description:
			"Mapsight UI examples — combined list, simple map, full layout, custom overlays, and router integration.",
	},
	{
		to: "/icons",
		title: "Icons",
		description:
			"Runtime icon editor and catalog — compose pictograms on a map or browse prebuilt sprites and Font Awesome glyphs.",
	},
] as const;

export function LandingPage() {
	return (
		<div className="landing">
			<div className="landing__inner">
				<div className="landing__hero">
					<h1>Mapsight ecosystem showcase</h1>
					<p>
						Interactive demos for the modular Mapsight packages — UI
						components, traffic-style icons, and runtime
						composition.
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
		</div>
	);
}
