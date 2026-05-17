import {useEffect, useState} from "react";

type Mountable = {
	/** mount function, receives element as parameter */
	mount(element: Element): void;

	/** unmount function, receives element as parameter */
	unmount(element: Element): void;
};

/**
 * Mounts the mountable object to the element
 *
 * @param mountable mountable object
 * @returns callback to set target
 */
export default function useMountable(mountable: undefined | Mountable) {
	const [target, setTarget] = useState<undefined | Element>();

	useEffect(() => {
		if (!mountable) {
			console.info("mount failed, no mountable");
			return;
		}

		if (!target) {
			console.info("mount failed, no target");
			return;
		}

		mountable.mount(target);
		return () => {
			mountable.unmount(target);
		};
	}, [target, mountable]);

	return setTarget;
}
