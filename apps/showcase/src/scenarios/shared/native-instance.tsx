import type {ComponentProps, ReactNode} from "react";

import Instance from "@mapsight/ui/components/instance";
import Wrapper from "@mapsight/ui/components/layout/wrapper";

/** Host owns the document and layout; Mapsight mounts directly, without an iframe. */
export function NativeInstance({
	children,
	...options
}: ComponentProps<typeof Instance> & {children: ReactNode}) {
	return (
		<Instance {...options}>
			<Wrapper className="service-map">{children}</Wrapper>
		</Instance>
	);
}
