import {legalDetails} from "./legal-details.ts";

export function ImprintPage() {
	return (
		<article className="showcase-page legal-page">
			<div className="showcase-page__hero">
				<h1>Imprint</h1>
			</div>

			<section>
				<h2>Information according to German legal notice rules</h2>
				<p>
					{legalDetails.name}
					{legalDetails.addressLines.map((line) => (
						<span key={line}>
							<br />
							{line}
						</span>
					))}
				</p>
			</section>

			<section>
				<h2>Contact</h2>
				<p>
					E-mail:{" "}
					<a href={`mailto:${legalDetails.email}`}>
						{legalDetails.email}
					</a>
				</p>
			</section>

			<section>
				<h2>Responsible for this website</h2>
				<p>
					{legalDetails.name}, address as listed above. This page is a
					small public showcase for the Mapsight open-source project.
				</p>
			</section>
		</article>
	);
}
