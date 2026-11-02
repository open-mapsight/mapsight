import {DemosSubnav} from "./demos-subnav.tsx";

export const iconItems = [
	{to: "/icons", label: "Editor"},
	{to: "/icons/catalog", label: "Catalog"},
] as const;

export function IconsNav() {
	return <DemosSubnav label="Icons" items={iconItems} />;
}
