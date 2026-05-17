import type {ReactElement} from "react";
import {Component} from "react";
import type {Root} from "react-dom/client";
import {createRoot} from "react-dom/client";

import type {MapController} from "@mapsight/core/lib/map/controller";
import {type EnhancedStore} from "@mapsight/core/types";

type MapsightMapProps = {
	store: EnhancedStore;
	id: string;
	controller: string;
	children: ReactElement;
};

export default class MapsightMap extends Component<MapsightMapProps> {
	private _isMounted = false;
	private _targetElement: HTMLElement | null = null;
	private _overlayRoot: Root | null = null;
	private _overlayContainer: HTMLElement | null = null;

	override componentDidMount() {
		const mapController = this._getMapController();
		if (mapController && this._targetElement) {
			this._isMounted = true;
			mapController.mount(this._targetElement);
		}

		if (this.props.children) {
			this._renderOverlay(this.props.children);
		}
	}

	override shouldComponentUpdate(nextProps: MapsightMapProps) {
		if (!this._isMounted) {
			return true;
		}

		if (nextProps.children) {
			this._renderOverlay(nextProps.children);
		}

		return false; // do not re-render, we control the content manually
	}

	override componentDidUpdate() {
		if (!this._isMounted) {
			const mapController = this._getMapController();
			if (mapController && this._targetElement) {
				this._isMounted = true;
				mapController.mount(this._targetElement);
			}
		}
	}

	override componentWillUnmount() {
		if (this._overlayRoot) {
			this._overlayRoot.unmount();
			this._overlayRoot = null;
		}

		const mapController = this._getMapController();
		if (mapController) {
			mapController.unmount();
		}
	}

	_getMapController() {
		const store = this.props.store;
		return store.getController(
			this.props.controller || "map",
		) as MapController;
	}

	_renderOverlay(overlay: ReactElement) {
		const mapController = this._getMapController();
		this._overlayContainer = mapController.getChildrenContainer() ?? null;

		if (this._overlayContainer) {
			// Create root once and reuse it for subsequent renders
			if (!this._overlayRoot) {
				this._overlayRoot = createRoot(this._overlayContainer);
			}
			this._overlayRoot.render(overlay);
		}
	}

	override render() {
		const {id, children} = this.props;

		return (
			<div
				id={id}
				ref={(el) => {
					this._targetElement = el;
				}}
				className="ms3-vector-editor-map"
			>
				<div className="ol-viewport">
					<canvas className="ol-unselectable" />
					<div className="ol-overlaycontainer">{children}</div>
				</div>
			</div>
		);
	}
}
