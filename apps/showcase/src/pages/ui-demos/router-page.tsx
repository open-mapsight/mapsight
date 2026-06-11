import {Link, Route, Routes} from "react-router-dom";

import App from "@mapsight/ui/components/app";

import {
	baseMapsightConfig,
	createOptions,
	styleFunction,
} from "../../ui-demos/router-config.tsx";
import {UiDemoShell} from "./ui-demo-shell.tsx";

function RoutedApp() {
	return <App />;
}

export function RouterPage() {
	return (
		<UiDemoShell
			baseMapsightConfig={baseMapsightConfig}
			createOptions={createOptions}
			styleFunction={styleFunction}
			mergeDefaultPlugins={false}
		>
			<nav className="ui-demo-router-nav">
				<ul>
					<li>
						<Link
							className="ui-demo-router-nav__link"
							to="/ui/router"
						>
							Home
						</Link>
					</li>
					<li>
						<Link
							className="ui-demo-router-nav__link"
							to="/ui/router/example-1"
						>
							Example 1
						</Link>
					</li>
					<li>
						<Link
							className="ui-demo-router-nav__link"
							to="/ui/router/example-2"
						>
							Example 2
						</Link>
					</li>
				</ul>
			</nav>

			<div className="ui-demo-router-content">
				<Routes>
					<Route index element={<span>Home</span>} />
					<Route path="example-1" element={<span>Beispiel 1</span>} />
					<Route path="example-2" element={<span>Beispiel 2</span>} />
				</Routes>
			</div>

			<Routes>
				<Route path="*" element={<RoutedApp />} />
			</Routes>
		</UiDemoShell>
	);
}
