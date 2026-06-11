import {CatalogGrid} from "./catalog-grid.tsx";
import {catalogIconCount, catalogSections} from "./catalog-sections.ts";

export function CatalogPage() {
	return (
		<div className="icon-route icon-route--catalog catalog-page">
			<header className="catalog-page__header">
				<div>
					<h1>Icon catalog</h1>
					<p>
						{catalogIconCount} icons across prebuilt traffic
						sprites, traffic-style pictograms, and Font Awesome
						pictograms.
					</p>
				</div>
			</header>

			{catalogSections.map((section) => (
				<section key={section.id} className="catalog-section">
					<h2>
						{section.title}{" "}
						<span className="catalog-section__count">
							({section.ids.length})
						</span>
					</h2>
					<p>{section.description}</p>
					<CatalogGrid
						ids={section.ids}
						kind={section.kind}
						showLabels
					/>
				</section>
			))}
		</div>
	);
}
