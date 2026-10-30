export default function StatusIndicator({status}: {status?: string | null}) {
	return (
		<div
			className={
				"ms3-status-indicator" +
				(status ? " ms3-status-indicator--" + status : "")
			}
		/>
	);
}
