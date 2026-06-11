import type {ReactNode} from "react";

import Instance from "@mapsight/ui/components/instance";
import createDefaultPlugins from "@mapsight/ui/plugins/browser-defaults";
import type {CreateOptions} from "@mapsight/ui/types";

import type {State} from "@mapsight/core/types";

type StyleFunction = Parameters<typeof Instance>[0]["styleFunction"];

export function UiDemoShell({
	baseMapsightConfig,
	createOptions,
	styleFunction,
	mergeDefaultPlugins = true,
	children,
}: {
	baseMapsightConfig: Partial<State>;
	createOptions: CreateOptions;
	styleFunction: StyleFunction;
	mergeDefaultPlugins?: boolean;
	children: ReactNode;
}) {
	const resolvedOptions = mergeDefaultPlugins
		? {
				...createOptions,
				plugins: [
					...createDefaultPlugins(),
					...(createOptions.plugins ?? []),
				],
			}
		: createOptions;

	return (
		<div className="ui-demo-embed">
			<div className="ui-demo-embed__frame">
				<div className="ui-demo">
					<Instance
						baseMapsightConfig={baseMapsightConfig}
						styleFunction={styleFunction}
						createOptions={resolvedOptions}
					>
						{children}
					</Instance>
				</div>
			</div>
		</div>
	);
}
