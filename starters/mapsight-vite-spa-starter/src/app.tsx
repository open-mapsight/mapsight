import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";

import {AppLayout} from "@/layout/app-layout";
import {AboutPage} from "@/pages/about-page";
import {MapPage} from "@/pages/map-page";

export function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route element={<AppLayout />}>
					<Route index element={<MapPage />} />
					<Route path="about" element={<AboutPage />} />
				</Route>
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</BrowserRouter>
	);
}
