import type {RefObject} from "react";
import {useCallback, useEffect, useState} from "react";
import {useSelector} from "react-redux";

import {translate} from "../../helpers/i18n";
import useHydrated from "../../hooks/useHydrated";
import {skipLinksSelector, viewSelector} from "../../store/selectors";

const TARGETS = [
	// Only a keyboard-operable map is a useful target.
	{
		id: "map",
		selector: ".ms3-map-target[tabindex]",
		label: "ui.skip-links.map",
	},
	{id: "list", selector: ".ms3-list-wrapper", label: "ui.skip-links.list"},
	{
		id: "search",
		selector: ".ms3-search input[type='search']",
		label: "ui.skip-links.search",
	},
] as const;

type TargetId = (typeof TARGETS)[number]["id"];

function findTarget(root: HTMLElement | null, selector: string) {
	const element = root?.querySelector<HTMLElement>(selector);
	if (!element) return null;
	// Hidden views (e.g. the list in map-only view) are not targets.
	return typeof element.checkVisibility === "function" &&
		!element.checkVisibility()
		? null
		: element;
}

/**
 * Skip links at the start of the instance (`uiState.skipLinks`, default true), shown
 * only on keyboard focus. They list the map, list and search when present and
 * render after hydration, so server markup is unchanged.
 */
export default function SkipLinks({
	rootRef,
}: {
	rootRef: RefObject<HTMLElement | null>;
}) {
	const enabled = useSelector(skipLinksSelector);
	const view = useSelector(viewSelector);
	const hydrated = useHydrated();
	const [present, setPresent] = useState<TargetId[]>([]);
	const refresh = useCallback(() => {
		setPresent(
			TARGETS.filter(({selector}) =>
				findTarget(rootRef.current, selector),
			).map(({id}) => id),
		);
	}, [rootRef]);
	useEffect(() => {
		if (enabled && hydrated) refresh();
	}, [enabled, hydrated, view, refresh]);

	if (!enabled || !hydrated || present.length === 0) return null;

	const jump = (selector: string) => {
		const target = findTarget(rootRef.current, selector);
		if (!target) {
			refresh();
			return;
		}
		if (!target.matches("input, button, select, textarea, [tabindex]")) {
			target.setAttribute("tabindex", "-1");
		}
		target.focus();
	};

	return (
		// Re-check targets when keyboard users reach the links.
		<div className="ms3-skip-links" onFocus={refresh}>
			{TARGETS.filter(({id}) => present.includes(id)).map(
				({id, selector, label}) => (
					<button
						key={id}
						type="button"
						className="ms3-skip-link"
						onClick={() => jump(selector)}
					>
						{translate(label)}
					</button>
				),
			)}
		</div>
	);
}
