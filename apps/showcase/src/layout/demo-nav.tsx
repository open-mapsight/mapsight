import {ShowcaseSubnav} from "./showcase-subnav.tsx";

export const demoItems = [
	{to: "/ui/combined-list", label: "Combined list"},
	{to: "/ui/simple-map", label: "Simple map"},
	{to: "/ui/full", label: "Full"},
	{to: "/ui/custom", label: "Custom"},
	{to: "/ui/router", label: "Router", end: false},
] as const;

export function DemoNav() {
	return <ShowcaseSubnav label="Demos" items={demoItems} />;
}
