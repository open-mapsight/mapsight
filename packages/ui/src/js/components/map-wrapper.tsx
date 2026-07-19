import type {PropsWithChildren, RefCallback} from "react";
import {useCallback, useContext, useRef} from "react";
import {useInView} from "react-intersection-observer";
import {useDispatch, useSelector, useStore} from "react-redux";

import {ComponentsContext} from "../helpers/components";
import useUpdateMapSizeOnRender from "../hooks/useUpdateMapSizeOnRender";
import useUpdateMapSizeOnTransitionEnd from "../hooks/useUpdateMapSizeOnTransitionEnd";
import useUpdateMapSizeOnViewChange from "../hooks/useUpdateMapSizeOnViewChange";
import {setMapIsOutOfViewport} from "../store/actions";
import {viewSelector} from "../store/selectors";
import {
	APP_EVENT_SCROLL_TO_MAP,
	useAppChannelEventListener,
} from "./helping/app-channel";

type MapWrapperProps = PropsWithChildren<{anchor?: "right" | "bottom"}>;

/**
 * Keeps the size/scroll shell, but lets hosts wrap `children` (e.g. SkipLink).
 *
 * @deprecated Host `components.MapWrapper` wrapping is a migration aid.
 *   Prefer composing overlays outside this slot. May change in the next major
 *   of `@mapsight/ui`.
 */
export default function MapWrapper(props: MapWrapperProps) {
	const {children, anchor} = props;
	const HostMapWrapper = useContext(ComponentsContext).MapWrapper;

	const dispatch = useDispatch();
	const mapWrapperRef = useRef<HTMLDivElement | undefined>(undefined);

	useUpdateMapSizeOnViewChange(
		useSelector(viewSelector) ?? "desktop",
		useStore(),
	);
	useUpdateMapSizeOnTransitionEnd(mapWrapperRef.current, dispatch);
	useUpdateMapSizeOnRender(dispatch);

	useAppChannelEventListener(
		APP_EVENT_SCROLL_TO_MAP,
		useCallback(() => {
			mapWrapperRef.current?.scrollIntoView({
				block: "start",
				behavior: "smooth",
			});
		}, [mapWrapperRef]),
	);

	const {ref: inViewRef} = useInView({
		threshold: 0,
		initialInView: true,
		fallbackInView: true,
		onChange: (inView) => dispatch(setMapIsOutOfViewport(!inView)),
	});

	const setRef: RefCallback<HTMLDivElement> = useCallback(
		(node) => {
			mapWrapperRef.current = node ?? undefined;
			inViewRef(node);
		},
		[inViewRef],
	);

	return (
		<div
			ref={setRef}
			className={`ms3-map-wrapper ms3-map-wrapper--anchored-${anchor} [ ms3-flex ms3-flex--column ] [ ms3-scroll-target ]`}
		>
			{HostMapWrapper ? (
				<HostMapWrapper anchor={anchor}>{children}</HostMapWrapper>
			) : (
				children
			)}
		</div>
	);
}

declare module "../helpers/components" {
	interface ComponentProps {
		MapWrapper: MapWrapperProps;
	}
}
