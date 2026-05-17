export {};
declare global {
	interface Window {
		_paq: Array<unknown>;
	}

	interface Function {
		displayName?: string;
	}
}
