import {Fragment} from "react";
import {Button, Disclosure, DisclosurePanel} from "react-aria-components";

import {translate} from "../../helpers/i18n";

export type ToolKeyboardHelpItem = {
	/** Translated key names, e.g. ["Leertaste", "Eingabe"]. */
	keys: string[];
	action: string;
};

/**
 * Collapsed key list for a map tool, so its overlay text can stay one short
 * sentence. Pan/zoom keys are already part of the map's own description.
 * Hosts can style `[data-expanded]` / `[data-focus-visible]` like other
 * react-aria-components parts of the UI.
 */
export default function ToolKeyboardHelp({
	items,
}: {
	items: ToolKeyboardHelpItem[];
}) {
	return (
		<Disclosure className="ms3-tool-overlay__keyboard-help">
			<Button
				slot="trigger"
				className="ms3-tool-overlay__keyboard-help-trigger"
			>
				{translate("ui.tool-overlay.keyboard-help")}
			</Button>
			<DisclosurePanel className="ms3-tool-overlay__keyboard-help-panel">
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
			</DisclosurePanel>
		</Disclosure>
	);
}
