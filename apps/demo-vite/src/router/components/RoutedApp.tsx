import {useLocation} from "react-router";

import App from "@mapsight/ui/components/app";

interface NavPosition {
	error404: boolean;
	reduced: boolean;
	area: string;
	content: object;
}

function calcNavPosition(_pathName: string): NavPosition {
	// TODO actually calc something

	return {
		error404: false,
		reduced: true,
		area: "",
		content: {},
	};
}

function RoutedApp() {
	const location = useLocation();
	const navPosition = calcNavPosition(location.pathname);

	console.log("navPosition", navPosition);

	return <App />;
}

export default RoutedApp;
