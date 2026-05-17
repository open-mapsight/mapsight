import {useCallback, useState} from "react";

import Button from "./Button.tsx";
import History from "./History.tsx";
import Icon from "./Icon.tsx";
import Modal from "./Modal.tsx";

function ShowHistoryButton({featureSource, ...props}: {featureSource: string}) {
	const [isHistoryOpen, setHistoryOpen] = useState(false);
	const open = useCallback(() => setHistoryOpen(true), [setHistoryOpen]);

	return (
		<>
			<Button onClick={open} {...props}>
				<Icon name="icon-history" />
			</Button>

			<Modal
				isOpen={isHistoryOpen}
				setIsOpen={setHistoryOpen}
				contentLabel="Versionsgeschichte"
				title="Versionsgeschichte"
			>
				<div className="ms3-vector-editor-modal__header">
					<History featureSource={featureSource} />
				</div>
			</Modal>
		</>
	);
}

export default ShowHistoryButton;
