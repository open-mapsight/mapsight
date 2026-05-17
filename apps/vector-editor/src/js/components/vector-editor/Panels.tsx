import type React from "react";

function Panels({
	bar,
	children,
	side,
}: {
	bar: React.ReactNode;
	children: React.ReactNode;
	side: React.ReactNode;
}) {
	return (
		<div className="ms3-vector-editor-panel ms3-vector-editor-panel--list">
			<div style={{flexGrow: 0}}>{bar}</div>

			<div style={{display: "flex", flexGrow: 1, flexDirection: "row"}}>
				<div style={{flexBasis: "60%", position: "relative"}}>
					<div
						style={{
							position: "absolute",
							padding: 10,
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							overflowY: "scroll",
						}}
					>
						{children}
					</div>
				</div>

				<div style={{flexBasis: "40%", borderLeft: "1px solid #ccc"}}>
					{side}
				</div>
			</div>
		</div>
	);
}

export default Panels;
