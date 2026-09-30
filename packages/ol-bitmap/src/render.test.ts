import {type IncomingMessage, type Server, createServer} from "node:http";

import {WORKER_OFFSCREEN_CANVAS} from "ol/has.js";
import CircleStyle from "ol/style/Circle.js";
import Fill from "ol/style/Fill.js";
import Icon from "ol/style/Icon.js";
import Stroke from "ol/style/Stroke.js";
import Style from "ol/style/Style.js";

import {createCanvas} from "@napi-rs/canvas";
import {afterAll, beforeAll, describe, expect, it} from "vitest";

import {
	DEFAULT_USER_AGENT,
	createMapBitmapRenderer,
	renderPng,
} from "./index.ts";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

function paintTile(z: number, x: number, y: number): Buffer {
	const canvas = createCanvas(256, 256);
	const ctx = canvas.getContext("2d");
	ctx.fillStyle = `hsl(${(x * 47 + y * 19 + z) % 360} 50% 70%)`;
	ctx.fillRect(0, 0, 256, 256);
	return canvas.toBuffer("image/png");
}

function paintIcon(): Buffer {
	const canvas = createCanvas(32, 32);
	const ctx = canvas.getContext("2d");
	ctx.fillStyle = "#16a34a";
	ctx.beginPath();
	ctx.arc(16, 16, 12, 0, Math.PI * 2);
	ctx.fill();
	return canvas.toBuffer("image/png");
}

async function startTileServer(): Promise<{
	close: () => Promise<void>;
	origin: string;
	userAgents: string[];
}> {
	const userAgents: string[] = [];
	const iconPng = paintIcon();
	const server: Server = createServer((req: IncomingMessage, res) => {
		userAgents.push(String(req.headers["user-agent"] ?? ""));
		if (req.url === "/icon.png") {
			res.writeHead(200, {
				"access-control-allow-origin": "*",
				"content-type": "image/png",
			});
			res.end(iconPng);
			return;
		}
		const match = /^\/tiles\/(\d+)\/(\d+)\/(\d+)\.png$/.exec(req.url ?? "");
		if (!match) {
			res.writeHead(404);
			res.end();
			return;
		}
		const body = paintTile(
			Number(match[1]),
			Number(match[2]),
			Number(match[3]),
		);
		res.writeHead(200, {
			"access-control-allow-origin": "*",
			"content-type": "image/png",
		});
		res.end(body);
	});
	await new Promise<void>((resolve) => {
		server.listen(0, "127.0.0.1", resolve);
	});
	const port = (server.address() as {port: number}).port;
	return {
		origin: `http://127.0.0.1:${port}`,
		userAgents,
		close: () =>
			new Promise((resolve, reject) => {
				server.close((error) => (error ? reject(error) : resolve()));
			}),
	};
}

function poiCollection(count: number) {
	const features = Array.from({length: count}, (_, index) => ({
		type: "Feature" as const,
		properties: {n: index + 1},
		geometry: {
			type: "Point" as const,
			coordinates: [
				10.5 + (index % 10) * 0.004,
				52.27 - Math.floor(index / 10) * 0.0025,
			],
		},
	}));
	return {type: "FeatureCollection" as const, features};
}

const pointStyle = new Style({
	image: new CircleStyle({
		radius: 6,
		fill: new Fill({color: "#dc2626"}),
		stroke: new Stroke({color: "#fff", width: 2}),
	}),
});

describe("ol-bitmap", () => {
	let origin = "";
	let close: () => Promise<void>;
	let userAgents: string[] = [];

	beforeAll(async () => {
		const server = await startTileServer();
		origin = server.origin;
		close = server.close;
		userAgents = server.userAgents;
	});

	afterAll(async () => {
		await close();
	});

	it("activates the worker OffscreenCanvas path", () => {
		expect(WORKER_OFFSCREEN_CANVAS).toBe(true);
	});

	it("renders a PNG from local XYZ tiles and a point", async () => {
		const result = await renderPng({
			width: 320,
			height: 240,
			view: {center: [10.5218, 52.264], zoom: 14},
			layers: [
				{type: "xyz", url: `${origin}/tiles/{z}/{x}/{y}.png`},
				{
					type: "vector",
					style: pointStyle,
					features: poiCollection(1),
				},
			],
		});

		expect(result.mimeType).toBe("image/png");
		expect(result.width).toBe(320);
		expect(result.height).toBe(240);
		expect(result.buffer.subarray(0, 4).equals(PNG_MAGIC)).toBe(true);
		expect(result.buffer.length).toBeGreaterThan(800);
		expect(result.elapsedMs).toBeGreaterThan(0);
		expect(userAgents.some((value) => value === DEFAULT_USER_AGENT)).toBe(
			true,
		);
	});

	it("loads an Icon from a URL", async () => {
		const result = await renderPng({
			width: 320,
			height: 240,
			view: {center: [10.5218, 52.264], zoom: 14},
			layers: [
				{type: "xyz", url: `${origin}/tiles/{z}/{x}/{y}.png`},
				{
					type: "vector",
					style: new Style({
						image: new Icon({
							src: `${origin}/icon.png`,
							width: 32,
							height: 32,
						}),
					}),
					features: poiCollection(1),
				},
			],
		});

		expect(result.buffer.subarray(0, 4).equals(PNG_MAGIC)).toBe(true);
		expect(result.buffer.length).toBeGreaterThan(800);
	});

	it("queues vector features onto a reused renderer", async () => {
		const renderer = await createMapBitmapRenderer({
			width: 320,
			height: 240,
			view: {center: [10.5218, 52.264], zoom: 14},
			layers: [
				{type: "xyz", url: `${origin}/tiles/{z}/{x}/{y}.png`},
				{type: "vector", style: pointStyle},
			],
		});

		try {
			const tilesOnly = await renderer.render();
			renderer.setVectorFeatures(poiCollection(100));
			const withPois = await renderer.render();

			expect(tilesOnly.buffer.subarray(0, 4).equals(PNG_MAGIC)).toBe(
				true,
			);
			expect(withPois.buffer.length).toBeGreaterThan(
				tilesOnly.buffer.length,
			);
			expect(withPois.elapsedMs).toBeLessThan(2_000);
		} finally {
			renderer.dispose();
		}
	});

	it("rejects an unknown vector key", async () => {
		const renderer = await createMapBitmapRenderer({
			width: 64,
			height: 64,
			view: {center: [10.52, 52.26], zoom: 3},
			layers: [{type: "vector", key: "pois", style: pointStyle}],
		});
		try {
			expect(() =>
				renderer.setVectorFeatures(poiCollection(1), "other"),
			).toThrow(/no vector layer/);
		} finally {
			renderer.dispose();
		}
	});

	it("rejects render after dispose", async () => {
		const renderer = await createMapBitmapRenderer({
			width: 64,
			height: 64,
			view: {center: [10.52, 52.26], zoom: 3},
			layers: [],
		});
		renderer.dispose();
		await expect(renderer.render()).rejects.toThrow(/disposed/);
	});

	it("rejects invalid size", async () => {
		await expect(
			createMapBitmapRenderer({
				width: 0,
				height: 64,
				view: {center: [0, 0], zoom: 1},
				layers: [],
			}),
		).rejects.toThrow(/positive integers/);
	});
});
