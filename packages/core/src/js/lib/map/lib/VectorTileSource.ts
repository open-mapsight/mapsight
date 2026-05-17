import OlVectorTileSource from "ol/source/VectorTile";

/**
 * @classdesc
 * Extended openlayers vector source that is connected to a mapsight feature source
 */
export default class VectorTileSource extends OlVectorTileSource {
	private _timer = 0;
	private _doRefresh = false;
	private _lastLoadTime: number | null = null;
	private _refreshTimeout: number | null = null;

	override getTile(
		...args: Parameters<typeof OlVectorTileSource.prototype.getTile>
	) {
		if (this._lastLoadTime === null) {
			this._lastLoadTime = Date.now();
		}

		return super.getTile.apply(this, args);
	}

	setTimer(timer: number) {
		this._timer = timer;
		this._updateRefreshing();
	}

	setDoRefresh(doRefresh: boolean) {
		this._doRefresh = doRefresh;
		this._updateRefreshing();
	}

	override refresh() {
		this._lastLoadTime = Date.now();
		this.clear();
		this.changed();

		if (this._refreshTimeout) {
			clearTimeout(this._refreshTimeout);
		}

		if (
			typeof window !== "undefined" &&
			this._doRefresh &&
			this._timer > 0
		) {
			this._refreshTimeout = setTimeout(
				() => this.refresh(),
				this._timer,
			) as unknown as number;
		}
	}

	_updateRefreshing() {
		if (
			typeof window !== "undefined" &&
			this._doRefresh &&
			this._timer > 0
		) {
			if (this._refreshTimeout) {
				clearTimeout(this._refreshTimeout);

				if (
					this._lastLoadTime &&
					this._lastLoadTime + this._timer < Date.now()
				) {
					this.refresh();
				}
			}

			this._refreshTimeout = setTimeout(
				() => this.refresh(),
				this._timer,
			) as unknown as number;
		}
	}
}
