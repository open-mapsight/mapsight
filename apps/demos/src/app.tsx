import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";

import {CountAggregatorDemoPage} from "./count-aggregator/count-aggregator-demo-page.tsx";
import {CountAggregatorHeadlessPage} from "./count-aggregator/count-aggregator-headless-page.tsx";
import {CatalogPage} from "./icons/catalog-page.tsx";
import {EditorPage} from "./icons/editor-page.tsx";
import {DemosLayout} from "./layout/demos-layout.tsx";
import {LandingPage} from "./pages/landing-page.tsx";
import {CombinedListPage} from "./pages/ui-demos/combined-list-page.tsx";
import {CustomPage} from "./pages/ui-demos/custom-page.tsx";
import {FullPage} from "./pages/ui-demos/full-page.tsx";
import {PointInputPage} from "./pages/ui-demos/point-input-page.tsx";
import {RouterPage} from "./pages/ui-demos/router-page.tsx";
import {SimpleMapPage} from "./pages/ui-demos/simple-map-page.tsx";
import {VectorWebglComparisonPage} from "./pages/ui-demos/vector-webgl-comparison-page.tsx";

export function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route element={<DemosLayout />}>
					<Route index element={<LandingPage />} />
					<Route
						path="ui"
						element={<Navigate to="/ui/combined-list" replace />}
					/>
					<Route
						path="ui/combined-list"
						element={<CombinedListPage />}
					/>
					<Route path="ui/simple-map" element={<SimpleMapPage />} />
					<Route
						path="ui/vector-webgl"
						element={<VectorWebglComparisonPage />}
					/>
					<Route path="ui/full" element={<FullPage />} />
					<Route path="ui/custom" element={<CustomPage />} />
					<Route path="ui/point-input" element={<PointInputPage />} />
					<Route path="ui/router/*" element={<RouterPage />} />
					<Route path="icons" element={<EditorPage />} />
					<Route path="icons/catalog" element={<CatalogPage />} />
					<Route
						path="count-aggregator"
						element={<CountAggregatorDemoPage />}
					/>
					<Route
						path="count-aggregator/headless"
						element={<CountAggregatorHeadlessPage />}
					/>
				</Route>
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</BrowserRouter>
	);
}
