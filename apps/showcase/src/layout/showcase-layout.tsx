import {Outlet, useLocation} from "react-router-dom";

import {DemoNav} from "./demo-nav.tsx";
import {IconsNav} from "./icons-nav.tsx";
import {ShowcaseFrame} from "./showcase-frame.tsx";

export function ShowcaseLayout() {
	const location = useLocation();
	const showDemoNav = location.pathname.startsWith("/ui");
	const showIconsNav = location.pathname.startsWith("/icons");
	const isIconEditor = location.pathname === "/icons";
	const mainClassName = [
		["/", "/imprint", "/privacy"].includes(location.pathname)
			? "showcase__main--brand"
			: "",
		showDemoNav ? "showcase__main--embed" : "",
		isIconEditor ? "showcase__main--icon-editor" : "",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<ShowcaseFrame
			pathname={location.pathname}
			fixedHeight={showDemoNav || isIconEditor}
			mainClassName={mainClassName}
			subnav={
				showDemoNav ? <DemoNav /> : showIconsNav ? <IconsNav /> : null
			}
		>
			<Outlet />
		</ShowcaseFrame>
	);
}
