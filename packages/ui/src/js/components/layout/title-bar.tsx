import {useSelector} from "react-redux";

import {makeReplaceableComponent} from "../../helpers/components";
import {titleSelector} from "../../store/selectors";

function TitleBar() {
	const title = useSelector(titleSelector);

	return (
		<div className="ms3-flex ms3-flex--row ms3-flex-no-shrink">
			<div className="ms3-page-title ms3-flex-grow">
				<h2>{title || ""}</h2>
			</div>
		</div>
	);
}

export default makeReplaceableComponent("TitleBar", TitleBar);
export {TitleBar as NonReplaceableTitleBar};

declare module "../../helpers/components" {
	interface ComponentProps {
		TitleBar: unknown;
	}
}
