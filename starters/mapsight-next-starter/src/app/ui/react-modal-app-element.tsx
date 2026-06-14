"use client";

import {type ReactNode, useEffect} from "react";

import {configureReactModalAppElement} from "@mapsight/ui/react-modal-app-element";

type Props = {
	appElementId: string;
	children: ReactNode;
};

export function ReactModalAppElement({appElementId, children}: Props) {
	useEffect(() => {
		const element = document.getElementById(appElementId);
		if (element instanceof HTMLElement) {
			configureReactModalAppElement(element);
		}
	}, [appElementId]);

	return children;
}
