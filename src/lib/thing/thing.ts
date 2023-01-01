import { writable } from "svelte/store";

interface Ops<T> {
	// TODO: generic infer `this` in create
	[x: string]: (this: any, ...args: any) => T
}

export function thing<T, S extends Ops<T>>(value: T, ops?: S) {
	const store = writable(value);
	const { subscribe, update } = store;

	const storeOps: {
		[K in keyof S]: () => void;
	} = Object.create(null);

	for (const name in ops) {
		storeOps[name] = function (...args) {
			update(() => ops[name].call(this, ...args))
		};
	}

	return {
		ops: storeOps,
		store: { subscribe },
	};
}