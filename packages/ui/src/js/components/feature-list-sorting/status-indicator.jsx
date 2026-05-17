export default function StatusIndicator({status}) {
	return (
		<div
			className={
				"ms3-status-indicator" +
				(status ? " ms3-status-indicator--" + status : "")
			}
		/>
	);
}
