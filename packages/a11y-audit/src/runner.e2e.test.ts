import {mkdtemp, readFile, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {pathToFileURL} from "node:url";

import {afterAll, beforeAll, describe, expect, it} from "vitest";

import {runAudit, writeReport} from "./runner.ts";
import type {AuditReport, Finding} from "./types.ts";

const fixture = pathToFileURL(
	path.join(import.meta.dirname, "test-fixtures", "defects.html"),
).href;

let report: AuditReport;
let outDir: string;

function find(
	rule: string,
	predicate: (finding: Finding) => boolean = () => true,
) {
	return report.findings.filter(
		(finding) => finding.rule === rule && predicate(finding),
	);
}

beforeAll(async () => {
	outDir = await mkdtemp(path.join(tmpdir(), "a11y-audit-e2e-"));
	report = await runAudit({
		outDir,
		browserPath: process.env.MAPSIGHT_A11Y_BROWSER,
		config: {
			name: "fixture",
			owners: [{id: "host-integration", selector: ".bs-embed"}],
			viewports: [
				{
					id: "desktop",
					width: 1024,
					height: 900,
					checks: [
						"axe",
						"keyboard",
						"dialogs",
						"map",
						"language",
						"text-spacing",
					],
				},
				{id: "reflow", width: 320, height: 640, checks: ["reflow"]},
			],
			targets: [
				{
					id: "fixture",
					title: "Defects fixture",
					url: fixture,
					root: "#app",
					settleMs: 100,
					features: ["map"],
				},
			],
		},
	});
	await writeReport(report, outDir);
}, 180_000);

afterAll(async () => {
	await rm(outDir, {recursive: true, force: true});
});

describe("runAudit on the defects fixture", () => {
	it("attributes axe failures to the closest owner", () => {
		const [buttonName] = find("axe/button-name");
		expect(buttonName?.owner).toBe("@mapsight/ui");
		expect(buttonName?.wcag).toContain("4.1.2");
		expect(buttonName?.status).toBe("fail");
	});

	it("walks the tab order and checks each stop", () => {
		const tabOrder = report.targets[0]!.states.find(
			(state) =>
				state.viewport === "desktop" && state.scenario === "initial",
		)?.tabOrder;
		expect(tabOrder?.[0]?.name).toBe("Gute Schaltfläche");
		expect(tabOrder?.[0]?.flags).toEqual([]);
		expect(find("keyboard/focus-unnamed")).toHaveLength(1);
		const [noRing] = find("keyboard/focus-visible");
		expect(noRing?.examples[0]?.name).toBe("Ohne Fokusrahmen");
		expect(find("keyboard/focus-visible")).toHaveLength(1);
		expect(find("keyboard/trap")).toHaveLength(0);
	});

	it("finds pointer-only controls", () => {
		const clickable = find("keyboard/not-focusable-clickable").flatMap(
			(finding) => finding.examples.map((example) => example.name),
		);
		expect(clickable).toContain("Klick mich");
		// tabindex=-1 items whose container ignores ArrowDown
		expect(clickable).toContain("Eins");
		expect(clickable).not.toContain("Drei");
		expect(find("dialog/activation-key")[0]?.examples[0]?.name).toBe(
			"Nur Maus",
		);
	});

	it("checks the popup contract", () => {
		expect(find("dialog/expanded-state")[0]?.examples[0]?.name).toBe(
			"Mehr",
		);
		expect(find("dialog/name")).toHaveLength(1);
		expect(find("dialog/escape")[0]?.examples[0]?.name).toBe("Optionen");
		expect(find("dialog/initial-focus")[0]?.status).toBe("needs-review");
		expect(find("dialog/focus-containment")).toHaveLength(1);
		expect(find("dialog/focus-return")[0]?.examples[0]?.name).toBe("Modal");
	});

	it("checks map, language, text spacing and reflow", () => {
		expect(find("map/keyboard-focus")[0]?.owner).toBe("openlayers");
		expect(find("map/name")).toHaveLength(1);
		expect(find("language/untranslated")[0]?.examples[0]?.name).toBe(
			"Zoom in",
		);
		expect(find("text-spacing/clipped")).toHaveLength(1);
		expect(find("reflow/horizontal-scroll")[0]?.selector).toBe("div.wide");
	});

	it("writes a markdown report", async () => {
		const markdown = await readFile(path.join(outDir, "report.md"), "utf8");
		expect(markdown).toContain("## Failures by owner");
		expect(markdown).toContain("### @mapsight/ui");
		expect(markdown).toContain("| 2.1.1 | Keyboard |");
	});

	it("fills the coverage matrix", () => {
		const keyboard = report.coverage.find((row) => row.sc === "2.1.1");
		expect(keyboard?.automatedResult).toBe("fail");
		expect(keyboard?.result).toBe("fail");
		const flashes = report.coverage.find((row) => row.sc === "2.3.1");
		expect(flashes?.result).toBe("incomplete");
	});
});
