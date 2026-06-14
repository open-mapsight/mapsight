export function AboutPage() {
	return (
		<section className="about-page">
			<h1>About</h1>
			<p>
				This route has no map. The home route mounts{" "}
				<code>Instance</code> on a route-scoped container — when you
				navigate here, React unmounts the map and its store is torn
				down.
			</p>
			<p>
				If you keep <code>Instance</code> at a layout level across
				routes, call <code>resetMapsightCore</code> when leaving map
				routes to avoid stale global store state. See the starter
				README.
			</p>
		</section>
	);
}
