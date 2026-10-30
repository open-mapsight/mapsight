import {Link} from "react-router-dom";

const sections = [
	{
		to: "/ui/combined-list",
		title: "UI demos",
		description:
			"Search, filter and select map features. Compare layouts, custom overlays and router integration.",
	},
	{
		to: "/count-aggregator",
		title: "Count aggregator",
		description:
			"Step through a counting workflow or try a custom UI, both backed by a mock API.",
	},
	{
		to: "/icons",
		title: "Icons",
		description:
			"Compose a map icon, adjust its appearance, or browse the pictogram and sprite catalogs.",
	},
] as const;

export function LandingPage() {
	return (
		<div className="showcase-page landing msb-content">
			<div className="showcase-page__hero">
				<p className="msb-eyebrow">Interactive examples</p>
				<h1>Try Mapsight in context.</h1>
				<p className="msb-intro">
					Find a service, explore a destination, or inspect traffic
					information. Try complete fictional websites and the UI
					patterns behind them.
				</p>
				<div className="landing__actions">
					<a
						className="msb-primary-link"
						href="/scenarios/index.html"
					>
						Explore scenarios <span aria-hidden="true">→</span>
					</a>
					<Link to="/ui/combined-list">Try a UI demo →</Link>
				</div>
				<p className="msb-status">
					Work in progress. Examples use demonstration data; Mapsight
					is used in controlled production deployments and is not yet
					turnkey.
				</p>
			</div>

			<section
				className="landing__scenarios"
				aria-labelledby="landing-scenarios"
			>
				<div>
					<p className="msb-eyebrow">Start with a task</p>
					<h2 id="landing-scenarios">
						One map framework. Different host sites.
					</h2>
					<p>
						The scenarios show Mapsight within the identity and
						workflow of a fictional administration, tourism site and
						traffic portal.
					</p>
				</div>
				<a href="/scenarios/index.html">Choose a scenario →</a>
			</section>

			<section className="landing__tools" aria-labelledby="landing-tools">
				<h2 id="landing-tools">Explore the building blocks</h2>
				<div className="landing__grid">
					{sections.map((section) => (
						<Link
							key={section.to}
							to={section.to}
							className="landing__card"
						>
							<h3>{section.title}</h3>
							<p>{section.description}</p>
							<span className="landing__card-link">Open →</span>
						</Link>
					))}
				</div>
			</section>
		</div>
	);
}
