import type {DependencyList} from "react";
import {useCallback, useEffect, useRef, useState} from "react";

type Options = {
	stuckHeaderHeight?: number;
	resetDeps?: DependencyList;
};

export default function useStickyHeader<
	TElement extends HTMLElement = HTMLElement,
>({stuckHeaderHeight = 30, resetDeps = []}: Options) {
	const [isHeaderStuck, setIsHeaderStuck] = useState(false);
	const [stickThreshold, setStickThreshold] = useState(0);

	const stickyHeaderRef = useRef<TElement | null>(null);
	const stickyScrollAreaRef = useRef<{scrollTop: number} | null>(null);

	const onScroll = useCallback(
		(e: React.UIEvent<HTMLDivElement, UIEvent>) => {
			setIsHeaderStuck(stickThreshold < e.currentTarget.scrollTop);
		},
		[stickThreshold],
	);

	useEffect(
		() => {
			if (stickyScrollAreaRef.current) {
				stickyScrollAreaRef.current.scrollTop = 0;
			}

			setIsHeaderStuck(false);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[...resetDeps],
	);

	useEffect(() => {
		if (stickyHeaderRef.current) {
			const headerSize = stickyHeaderRef.current.offsetHeight;
			setStickThreshold(headerSize - stuckHeaderHeight);
		}
	}, [stickyHeaderRef.current?.offsetHeight, stuckHeaderHeight]);

	return {
		isHeaderStuck,
		stickyHeaderRef,
		stickyScrollAreaRef,
		onScroll,
	};
}
