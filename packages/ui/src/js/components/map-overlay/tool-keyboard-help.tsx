import {Fragment} from "react";

import {translate} from "../../helpers/i18n";

export type ToolKeyboardHelpItem = {
	/** Translated key names, e.g. ["Leertaste", "Eingabe"]. */
	keys: string[];
	action: string;
};

/**
 * Collapsed key list for a map tool, so its overlay text can stay one short
 * sentence. Pan/zoom keys are already part of the map's own description.
 */
export default function ToolKeyboardHelp({
	items,
}: {
	items: ToolKeyboardHelpItem[];
}) {
	return (
		<details className="ms3-tool-overlay__keyboard-help">
			<summary>{translate("ui.tool-overlay.keyboard-help")}</summary>
			<p>{translate("ui.tool-overlay.keyboard-help.focus")}</p>
			<dl>
				{items.map(({keys, action}) => (
					<Fragment key={action}>
						<dt>
							{keys.map((key, index) => (
								<Fragment key={key}>
									{index > 0 && " / "}
									<kbd>{key}</kbd>
								</Fragment>
							))}
						</dt>
						<dd>{action}</dd>
					</Fragment>
				))}
			</dl>
		</details>
	);
}
