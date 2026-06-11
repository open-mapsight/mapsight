import {ShowcaseSubnav} from "./showcase-subnav.tsx";

export const iconItems = [
	{to: "/icons", label: "Editor"},
	{to: "/icons/catalog", label: "Catalog"},
] as const;

export function IconsNav() {
	return <ShowcaseSubnav label="Icons" items={iconItems} />;
}
