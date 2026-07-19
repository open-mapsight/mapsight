import {APP_EVENT_PARTIAL_CONTENT_CHANGED} from "../components/helping/app-channel";

/**
 * Historic event name used by pre-OSS hosts (`page-partial-content-changed`).
 * Prefer {@link APP_EVENT_PARTIAL_CONTENT_CHANGED} for new code.
 */
export const EVENT_PARTIAL_CONTENT_CHANGED = "page-partial-content-changed";

type HubListener = (...args: unknown[]) => void;

/**
 * Minimal process-wide bus for hosts that subscribe outside React before
 * `browserEmbed` / `create`. Prefer AppChannel listeners or
 * `createOptions.partialChangeHandler` for new hosts.
 */
class GlobalEventHub {
	#listeners = new Map<string, Set<HubListener>>();

	setMaxListeners(_n: number): void {
		// no-op — kept for EventEmitter drop-in compatibility
	}

	on(event: string, listener: HubListener): this {
		let set = this.#listeners.get(event);
		if (!set) {
			set = new Set();
			this.#listeners.set(event, set);
		}
		set.add(listener);
		return this;
	}

	off(event: string, listener: HubListener): this {
		this.#listeners.get(event)?.delete(listener);
		return this;
	}

	removeListener(event: string, listener: HubListener): this {
		return this.off(event, listener);
	}

	emit(event: string, ...args: unknown[]): boolean {
		const set = this.#listeners.get(event);
		if (!set || set.size === 0) {
			return false;
		}
		for (const listener of [...set]) {
			listener(...args);
		}
		return true;
	}
}

const hub = new GlobalEventHub();
hub.setMaxListeners(50);

export default hub;

/**
 * EventListener suitable for {@link CreateOptions.partialChangeHandler}.
 * Emits both the historic and current event names on the process hub.
 */
export function createHubPartialChangeHandler(): EventListener {
	return (event) => {
		hub.emit(EVENT_PARTIAL_CONTENT_CHANGED, event);
		hub.emit(APP_EVENT_PARTIAL_CONTENT_CHANGED, event);
	};
}
