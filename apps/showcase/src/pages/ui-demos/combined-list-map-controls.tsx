import {useState} from "react";

import LayerSwitcher from "@mapsight/ui/components/layer-switcher/index";
import Attribution from "@mapsight/ui/components/map-overlay/attribution";
import Logo from "@mapsight/ui/components/map-overlay/logo";
import NativeDialog from "@mapsight/ui/components/native-dialog";
import DesktopViewToggleButton from "@mapsight/ui/components/view-toggle-button/desktop-button";

/** In-place native dialogs inherit this demo's tokens, including in map-only view. */
export function ReferenceMapLayers() {
	const [open, setOpen] = useState(false);
	return (
		<>
			<button
				type="button"
				className="ms3-map-overlay__button ms3-map-overlay__button--with-icon ms3-map-overlay__button--layers"
				aria-label="Kartenthemen wählen"
				aria-expanded={open}
				aria-haspopup="dialog"
				onClick={() => setOpen(true)}
			>
				<span className="ms3-map-overlay__button__label">
					Kartenthemen
				</span>
			</button>
			<NativeDialog
				isOpen={open}
				onClose={() => setOpen(false)}
				title="Kartenthemen"
				closeLabel="Kartenthemen schließen"
				className="reference-demo__dialog"
				sheetClassName="reference-demo__dialog-sheet"
			>
				<p className="reference-demo__dialog-hint">
					Sichtbare Themen erscheinen gemeinsam in Karte und Liste.
				</p>
				<LayerSwitcher />
			</NativeDialog>
			<DesktopViewToggleButton />
		</>
	);
}

export function ReferenceMapCredits() {
	const [open, setOpen] = useState(false);
	return (
		<div className="reference-demo__credits">
			<div className="reference-demo__desktop-credit">
				<Logo />
			</div>
			<button
				type="button"
				className="reference-demo__sources ms3-map-overlay__button ms3-map-overlay__button--with-icon ms3-map-overlay__button--info"
				aria-label="Kartenquellen öffnen"
				aria-expanded={open}
				aria-haspopup="dialog"
				onClick={() => setOpen(true)}
			>
				<span className="ms3-map-overlay__button__label">
					Kartenquellen
				</span>
			</button>
			<NativeDialog
				isOpen={open}
				onClose={() => setOpen(false)}
				title="Kartenquellen"
				closeLabel="Kartenquellen schließen"
				className="reference-demo__dialog"
				sheetClassName="reference-demo__dialog-sheet"
			>
				<div className="reference-demo__source-details">
					<Attribution />
					<Logo />
					<p>Die sechs Beispielorte sind frei erfunden.</p>
				</div>
			</NativeDialog>
		</div>
	);
}
