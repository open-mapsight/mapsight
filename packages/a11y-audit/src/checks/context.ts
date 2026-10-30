import type {CDPSession, Page} from "playwright";

import {rule} from "../rules.ts";
import type {
	ElementInfo,
	FindingStatus,
	Impact,
	RawFinding,
	ResolvedConfig,
	TargetConfig,
	Viewport,
} from "../types.ts";

export interface CheckContext {
	page: Page;
	cdp: CDPSession;
	config: ResolvedConfig;
	target: TargetConfig;
	viewport: Viewport;
	/** Reloads the target and waits until it is ready again. */
	reload(): Promise<void>;
	report(finding: RawFinding): void;
	/** Problem while checking; pass false for purely informational notes. */
	note(message: string, isError?: boolean): void;
}

export function reportRule(
	context: CheckContext,
	ruleId: string,
	element: ElementInfo,
	description: string,
	overrides: {status?: FindingStatus; impact?: Impact} = {},
): void {
	const meta = rule(ruleId);
	context.report({
		rule: meta.id,
		source: "mapsight",
		title: meta.title,
		description,
		wcag: meta.wcag,
		level: meta.level,
		impact: overrides.impact ?? meta.impact,
		status: overrides.status ?? "fail",
		element,
		fix: meta.fix,
	});
}

export interface AxNode {
	role: string;
	name: string;
	ignored: boolean;
}

/** Accessible role and name of the element carrying `data-a11y-audit-id`, via CDP. */
export async function axOfMark(
	context: Pick<CheckContext, "page" | "cdp">,
	mark: string,
): Promise<AxNode | null> {
	const found = await context.page.evaluate((id) => {
		const api = window.__mapsightA11y!;
		api.probe = api.byMark(id);
		return Boolean(api.probe);
	}, mark);
	if (!found) {
		return null;
	}
	const {result} = await context.cdp.send("Runtime.evaluate", {
		expression: "window.__mapsightA11y.probe",
		objectGroup: "mapsight-a11y-audit",
	});
	if (!result.objectId) {
		return null;
	}
	try {
		const {nodes} = await context.cdp.send(
			"Accessibility.getPartialAXTree",
			{
				objectId: result.objectId,
				fetchRelatives: false,
			},
		);
		const node = nodes[0];
		if (!node) {
			return null;
		}
		return {
			role: String(node.role?.value ?? ""),
			name: String(node.name?.value ?? "").trim(),
			ignored: Boolean(node.ignored),
		};
	} finally {
		await context.cdp.send("Runtime.releaseObjectGroup", {
			objectGroup: "mapsight-a11y-audit",
		});
	}
}

export async function settle(page: Page, ms = 300): Promise<void> {
	await page.waitForTimeout(ms);
	await page.evaluate(
		() =>
			new Promise<void>((resolve) =>
				requestAnimationFrame(() =>
					requestAnimationFrame(() => resolve()),
				),
			),
	);
}

export async function clipShot(
	page: Page,
	rect: {x: number; y: number; width: number; height: number},
	inflate = 6,
): Promise<Buffer | null> {
	const viewport = page.viewportSize();
	if (!viewport) {
		return null;
	}
	const x = Math.max(0, Math.floor(rect.x - inflate));
	const y = Math.max(0, Math.floor(rect.y - inflate));
	const width = Math.min(
		viewport.width - x,
		Math.ceil(rect.width + inflate * 2),
	);
	const height = Math.min(
		viewport.height - y,
		Math.ceil(rect.height + inflate * 2),
	);
	if (width < 1 || height < 1) {
		return null;
	}
	return page.screenshot({
		clip: {x, y, width, height},
		animations: "disabled",
		caret: "hide",
	});
}
