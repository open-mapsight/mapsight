import {createHash} from "node:crypto";
import {mkdir, readFile, rm, stat, unlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {main} from "./optimize-icons";

type OptimizeManifest = {
	files: Record<string, {outputs: string[]}>;
};

function parseManifest(raw: string): OptimizeManifest {
	return JSON.parse(raw) as OptimizeManifest;
}

describe("optimize-icons.ts", () => {
	let tmpDir: string;
	let srcDir: string;
	let destDir: string;

	beforeEach(async () => {
		tmpDir = path.join(
			os.tmpdir(),
			`optimize-icons-test-${Math.random().toString(36).slice(2)}`,
		);
		srcDir = path.join(tmpDir, "src");
		destDir = path.join(tmpDir, "dest");
		await mkdir(srcDir, {recursive: true});
		await mkdir(destDir, {recursive: true});

		// Mock process.exitCode to avoid affecting the test runner
		vi.stubGlobal("process", {
			...process,
			exitCode: 0,
		});
	});

	afterEach(async () => {
		if (srcDir && destDir) {
			try {
				const manifestPath = getManifestPath(srcDir, destDir);
				await unlink(manifestPath);
			} catch {
				// ignore if manifest doesn't exist
			}
		}
		if (tmpDir) {
			await rm(tmpDir, {recursive: true, force: true});
		}
		vi.unstubAllGlobals();
	});

	async function runScript(args: Record<string, string | boolean>) {
		const argv = ["node", "optimize-icons.ts"];
		for (const [key, value] of Object.entries(args)) {
			if (typeof value === "boolean") {
				if (value) argv.push(`--${key}`);
			} else {
				argv.push(`--${key}`, String(value));
			}
		}

		vi.stubGlobal("process", {
			...process,
			argv,
		});

		await main();
	}

	function getManifestPath(src: string, dest: string) {
		const scriptPath = fileURLToPath(import.meta.url);
		const packageRoot = path.resolve(path.dirname(scriptPath), "..");
		const hash = createHash("sha256")
			.update(`${path.resolve(src)}:${path.resolve(dest)}`)
			.digest("hex")
			.slice(0, 16);
		return path.join(
			packageRoot,
			"tmp",
			`optimize-icons-manifest-${hash}.json`,
		);
	}

	it("should process an SVG file and produce SVG, PNG, and WebP outputs", async () => {
		const svgContent = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="red"/></svg>`;
		await writeFile(path.join(srcDir, "test.svg"), svgContent);

		await runScript({
			src: srcDir,
			dest: destDir,
		});

		expect(await stat(path.join(destDir, "test.svg"))).toBeDefined();
		expect(await stat(path.join(destDir, "test.png"))).toBeDefined();
		expect(await stat(path.join(destDir, "test.webp"))).toBeDefined();

		const manifestPath = getManifestPath(srcDir, destDir);
		const manifestRaw = await readFile(manifestPath, "utf8");
		const outputs = parseManifest(manifestRaw).files["test.svg"]?.outputs;
		expect(outputs).toBeDefined();
		expect(outputs).toContain("test.svg");
		expect(outputs).toContain("test.png");
		expect(outputs).toContain("test.webp");
	});

	it("should process a PNG file and produce PNG and WebP outputs", async () => {
		// Create a tiny valid PNG using sharp if possible, or just a placeholder if we skip actual image check
		// Since we have sharp available in the environment, let's use it if we can, but simpler is to use a minimal PNG buffer.
		const sharp = (await import("sharp")).default;
		const pngBuffer = await sharp({
			create: {
				width: 10,
				height: 10,
				channels: 4,
				background: {r: 255, g: 0, b: 0, alpha: 0.5},
			},
		})
			.png()
			.toBuffer();

		await writeFile(path.join(srcDir, "test.png"), pngBuffer);

		await runScript({
			src: srcDir,
			dest: destDir,
		});

		expect(await stat(path.join(destDir, "test.png"))).toBeDefined();
		expect(await stat(path.join(destDir, "test.webp"))).toBeDefined();
		await expect(
			async () => await stat(path.join(destDir, "test.svg")),
		).rejects.toThrow();
	});

	it("should scale images when --scale is provided", async () => {
		const svgContent = `<svg width="10" height="10" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="red"/></svg>`;
		await writeFile(path.join(srcDir, "scale-test.svg"), svgContent);

		await runScript({
			src: srcDir,
			dest: destDir,
			scale: "2",
		});

		const sharp = (await import("sharp")).default;
		const metadata = await sharp(
			path.join(destDir, "scale-test.png"),
		).metadata();
		expect(metadata.width).toBe(20);
		expect(metadata.height).toBe(20);
	});

	it("should skip processing if files haven't changed", async () => {
		const svgContent = `<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" fill="red"/></svg>`;
		const testFile = path.join(srcDir, "skip-test.svg");
		await writeFile(testFile, svgContent);

		// First run
		await runScript({
			src: srcDir,
			dest: destDir,
			verbose: true,
		});

		const destFile = path.join(destDir, "skip-test.png");
		const firstStat = await stat(destFile);

		// Second run
		await runScript({
			src: srcDir,
			dest: destDir,
			verbose: true,
		});

		const secondStat = await stat(destFile);
		expect(secondStat.mtimeMs).toBe(firstStat.mtimeMs);
	});

	it("should only produce specified targets when --target is provided", async () => {
		const svgContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="red"/></svg>`;
		await writeFile(path.join(srcDir, "target-test.svg"), svgContent);

		await runScript({
			src: srcDir,
			dest: destDir,
			target: "png",
		});

		expect(await stat(path.join(destDir, "target-test.png"))).toBeDefined();
		await expect(
			async () => await stat(path.join(destDir, "target-test.svg")),
		).rejects.toThrow();
		await expect(
			async () => await stat(path.join(destDir, "target-test.webp")),
		).rejects.toThrow();

		const manifestPath = getManifestPath(srcDir, destDir);
		const manifestRaw = await readFile(manifestPath, "utf8");
		const outputs =
			parseManifest(manifestRaw).files["target-test.svg"].outputs;
		expect(outputs).toEqual(["target-test.png"]);
	});

	it("should produce multiple specified targets", async () => {
		const svgContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="red"/></svg>`;
		await writeFile(path.join(srcDir, "multi-target.svg"), svgContent);

		await runScript({
			src: srcDir,
			dest: destDir,
			target: "svg,webp",
		});

		expect(
			await stat(path.join(destDir, "multi-target.svg")),
		).toBeDefined();
		expect(
			await stat(path.join(destDir, "multi-target.webp")),
		).toBeDefined();
		await expect(
			async () => await stat(path.join(destDir, "multi-target.png")),
		).rejects.toThrow();
	});

	it("should compact SVG output by default and pretty print when requested", async () => {
		const svgContent = `<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg"><title>test icon</title><g id="wrapper" class="icon"><rect id="box" class="shape" width="10" height="10" fill="red"/></g></svg>`;
		await writeFile(path.join(srcDir, "format-test.svg"), svgContent);

		await runScript({
			src: srcDir,
			dest: destDir,
			target: "svg",
		});

		const compactSvg = await readFile(
			path.join(destDir, "format-test.svg"),
			"utf8",
		);
		expect(compactSvg).not.toContain("\n\t");
		expect(compactSvg).not.toContain("<title");
		expect(compactSvg).not.toContain("class=");
		expect(compactSvg).not.toContain("id=");

		await runScript({
			src: srcDir,
			dest: destDir,
			target: "svg",
			pretty: true,
			force: true,
		});

		const prettySvg = await readFile(
			path.join(destDir, "format-test.svg"),
			"utf8",
		);
		expect(prettySvg).toContain("\n\t");
		expect(prettySvg.endsWith("\n")).toBe(true);
	});

	it("should fail SVG files that use xlink attributes", async () => {
		const svgContent = `<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><path id="shape" d="M0 0h10v10H0z"/></defs><use xlink:href="#shape"/></svg>`;
		await writeFile(path.join(srcDir, "xlink-test.svg"), svgContent);

		await runScript({
			src: srcDir,
			dest: destDir,
			target: "svg",
		});

		expect(process.exitCode).toBe(1);
		await expect(
			async () => await stat(path.join(destDir, "xlink-test.svg")),
		).rejects.toThrow();
	});

	it("should fail SVG files that use style elements", async () => {
		const svgContent = `<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg"><style>.shape{fill:red}</style><rect class="shape" width="10" height="10"/></svg>`;
		await writeFile(path.join(srcDir, "style-test.svg"), svgContent);

		await runScript({
			src: srcDir,
			dest: destDir,
			target: "svg",
		});

		expect(process.exitCode).toBe(1);
		await expect(
			async () => await stat(path.join(destDir, "style-test.svg")),
		).rejects.toThrow();
	});

	it("should fail if an invalid target is provided", async () => {
		await expect(
			runScript({
				src: srcDir,
				dest: destDir,
				target: "invalid",
			}),
		).rejects.toThrow("Invalid target format: invalid");
	});
});
