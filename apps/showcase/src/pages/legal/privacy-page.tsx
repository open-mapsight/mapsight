import {legalDetails} from "./legal-details.ts";

export function PrivacyPage() {
	return (
		<article className="showcase-page legal-page">
			<div className="showcase-page__hero">
				<h1>Privacy policy</h1>
			</div>

			<section>
				<h2>Controller</h2>
				<p>
					{legalDetails.name}
					{legalDetails.addressLines.map((line) => (
						<span key={line}>
							<br />
							{line}
						</span>
					))}
				</p>
				<p>
					E-mail:{" "}
					<a href={`mailto:${legalDetails.email}`}>
						{legalDetails.email}
					</a>
				</p>
			</section>

			<section>
				<h2>Purpose of this website</h2>
				<p>
					This website provides public demo pages for Mapsight. It is
					a static website and does not include analytics,
					advertising, tracking pixels, user accounts, comment forms,
					newsletters, or payment functionality.
				</p>
			</section>

			<section>
				<h2>Access data and hosting</h2>
				<p>
					When you visit this website, technical access data is
					processed so the page can be delivered securely and
					reliably. This can include your IP address, request time,
					requested URL, HTTP status code, transferred data volume,
					referrer, user agent, and TLS connection metadata.
				</p>
				<p>
					The website is hosted on server infrastructure operated by
					Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen,
					Germany. Access logs are used for operation,
					troubleshooting, abuse prevention, and security. They are
					not used for advertising or behavioral profiling.
				</p>
				<p>
					The legal basis is Art. 6(1)(f) GDPR: the legitimate
					interest in operating a secure and reliable public website.
				</p>
			</section>

			<section>
				<h2>Cloudflare</h2>
				<p>
					The domain may be routed through Cloudflare for DNS, TLS,
					caching, or abuse-protection infrastructure. If Cloudflare
					proxying is active, connection data such as your IP address,
					request metadata, and security signals is processed by
					Cloudflare before requests reach the origin server.
				</p>
				<p>
					Cloudflare processing is used only for delivery, security,
					and availability of this website, not for advertising by
					this website.
				</p>
			</section>

			<section>
				<h2>Cookies, analytics, and third-party content</h2>
				<p>
					This showcase does not set tracking cookies and does not use
					analytics or advertising tools. The demo pages are designed
					to run with static assets and mock data from this website.
					They should not load map tiles, fonts, scripts, or analytics
					from third-party services for normal operation.
				</p>
			</section>

			<section>
				<h2>Your rights</h2>
				<p>
					Under the GDPR, you may have rights to access,
					rectification, erasure, restriction of processing,
					objection, and data portability, depending on the
					circumstances. You also have the right to lodge a complaint
					with a data protection supervisory authority.
				</p>
				<p>
					For privacy requests, contact{" "}
					<a href={`mailto:${legalDetails.email}`}>
						{legalDetails.email}
					</a>
					.
				</p>
			</section>
		</article>
	);
}
