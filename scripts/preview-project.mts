import path from "node:path/posix";

import * as ts from "typescript";

export type Sources = Map<string, string>;

export function runtimeFile(file: string): boolean {
	return (
		!/(?:^|\/)(?:__tests__|e2e|node_modules)\//.test(file) &&
		!/(?:\.d\.ts|\.(?:test|spec)\.[cm]?[jt]sx?)$/.test(file) &&
		/\.(?:[cm]?[jt]sx?|s?css|json|geojson|svg|html)$/.test(file)
	);
}

function parse(file: string, source: string): ts.SourceFile {
	return ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
}

/** Read syntax only: no PR modules, configs, plugins, or scripts are executed. */
export function runtimeImports(file: string, source: string): string[] {
	if (file.endsWith(".html"))
		return [...source.matchAll(/(?:src|href)=["'](\.[^"']+)["']/g)].map(
			(match) => match[1]!,
		);
	if (/\.s?css$/.test(file)) {
		return [
			...source.matchAll(/@(?:use|forward|import)\s+["']([^"']+)["']/g),
		].map((match) => match[1]!);
	}
	if (!/\.[cm]?[jt]sx?$/.test(file)) return [];
	const imports: string[] = [];
	function visit(node: ts.Node): void {
		if (ts.isImportDeclaration(node)) {
			const clause = node.importClause;
			const names = clause?.namedBindings;
			if (
				clause?.isTypeOnly ||
				(names &&
					ts.isNamedImports(names) &&
					!clause?.name &&
					names.elements.length > 0 &&
					names.elements.every((name) => name.isTypeOnly))
			)
				return;
			if (ts.isStringLiteral(node.moduleSpecifier))
				imports.push(node.moduleSpecifier.text);
		} else if (ts.isExportDeclaration(node)) {
			if (
				node.isTypeOnly ||
				(node.exportClause &&
					ts.isNamedExports(node.exportClause) &&
					node.exportClause.elements.length > 0 &&
					node.exportClause.elements.every((name) => name.isTypeOnly))
			)
				return;
			if (
				node.moduleSpecifier &&
				ts.isStringLiteral(node.moduleSpecifier)
			)
				imports.push(node.moduleSpecifier.text);
		} else if (
			(ts.isCallExpression(node) &&
				(node.expression.kind === ts.SyntaxKind.ImportKeyword ||
					(ts.isIdentifier(node.expression) &&
						node.expression.text === "require"))) ||
			(ts.isNewExpression(node) &&
				ts.isIdentifier(node.expression) &&
				node.expression.text === "URL")
		) {
			const first = node.arguments?.[0];
			if (first && ts.isStringLiteral(first)) imports.push(first.text);
		}
		ts.forEachChild(node, visit);
	}
	visit(parse(file, source));
	return imports;
}

function resolveFile(base: string, sources: Sources): string | undefined {
	base = base.split("?")[0]!;
	const stem = base.replace(/\.[cm]?jsx?$/, "");
	for (const candidate of new Set([base, stem])) {
		for (const extension of [
			"",
			".ts",
			".tsx",
			".js",
			".jsx",
			".mts",
			".css",
			".scss",
		]) {
			for (const filename of [
				candidate + extension,
				`${candidate}/index${extension}`,
				path.join(
					path.dirname(candidate),
					`_${path.basename(candidate)}${extension}`,
				),
			]) {
				if (sources.has(filename)) return filename;
			}
		}
	}
	return undefined;
}

function exportTarget(value: unknown): string | undefined {
	if (typeof value === "string") return value;
	if (!value || typeof value !== "object") return undefined;
	const conditions = value as Record<string, unknown>;
	for (const key of ["browser", "import", "default"]) {
		const target = exportTarget(conditions[key]);
		if (target) return target;
	}
	return undefined;
}

interface Generation {
	inputs: string[];
	outputs?: string[];
	consumers?: string[];
	tools?: string[];
}
interface Manifest {
	name?: string;
	exports?: string | Record<string, unknown>;
	imports?: Record<string, unknown>;
	main?: string;
	publishConfig?: {directory?: string};
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	mapsight?: {preview?: {guides?: string; generated?: Generation[]}};
}
interface Package {
	directory: string;
	manifest: Manifest;
}
interface Config {
	directory: string;
	rootDir?: string;
	outDir?: string;
	paths?: Record<string, string[]>;
}
interface Guide {
	label: string;
	check: string;
	scenarios?: string[];
	sample?: boolean;
	note?: string;
}
interface Scenario {
	modules: string[];
	check: string;
}
interface Guides {
	router: string;
	pages: Record<string, Guide>;
	scenarios: Record<string, Scenario>;
	deprioritize?: string[];
}
export interface Change {
	filename: string;
	previous_filename?: string;
}
interface Route extends Partial<Guide> {
	path: string;
	file: string;
	component: string;
}
export interface ReviewLink extends Route {
	evidence: string;
	distance: number;
	label: string;
	check: string;
}

function within(file: string, directory: string): boolean {
	return (
		file === directory ||
		file.startsWith(`${directory.replace(/\/$/, "")}/`)
	);
}

function relative(directory: string, value: string): string {
	if (typeof value !== "string" || path.isAbsolute(value))
		throw new Error(`Expected a relative project path: ${value}`);
	const filename = path.normalize(path.join(directory, value));
	if (filename.startsWith("../"))
		throw new Error(`Path escapes the repository: ${value}`);
	return filename;
}

function knownKeys(
	value: object,
	allowed: string[],
	description: string,
): void {
	for (const key of Object.keys(value))
		if (!allowed.includes(key))
			throw new Error(`Unknown ${description} field: ${key}`);
}

function matchExport(
	exports: Record<string, unknown>,
	key: string,
): string | undefined {
	const exact = exportTarget(exports[key]);
	if (exact) return exact;
	for (const pattern of Object.keys(exports)
		.filter((name) => name.includes("*"))
		.sort((a, b) => b.length - a.length)) {
		const [prefix, suffix] = pattern.split("*") as [string, string];
		if (!key.startsWith(prefix) || !key.endsWith(suffix)) continue;
		const target = exportTarget(exports[pattern]);
		if (target)
			return target.replaceAll(
				"*",
				key.slice(prefix.length, suffix ? -suffix.length : undefined),
			);
	}
	return undefined;
}

/** All discovery uses the supplied source snapshot, not the filesystem or TS plugins. */
export class PreviewProject {
	readonly sources: Sources;
	readonly packages: Package[];
	readonly configs: Config[];
	readonly forward = new Map<string, Set<string>>();
	readonly reverse = new Map<string, Set<string>>();
	readonly rules: (Generation & {directory: string; owner: Package})[];
	readonly app: Package;
	readonly guides: Guides;
	readonly router: string;
	readonly routes: Route[] = [];
	readonly shells = new Set<string>();
	constructor(
		sources: Sources,
		appName = "@mapsight/showcase",
		metadata: Sources = sources,
	) {
		this.sources = sources;
		this.packages = [...sources]
			.filter(([file]) => /(?:^|\/)package\.json$/.test(file))
			.map(([file, source]) => {
				const manifest = JSON.parse(source) as Manifest;
				// Older PR heads can use current trusted metadata without replacing their exports or configs.
				const fallback = metadata.get(file);
				if (!manifest.mapsight?.preview && fallback)
					manifest.mapsight = (
						JSON.parse(fallback) as Manifest
					).mapsight;
				return {directory: path.dirname(file), manifest};
			});
		const app = this.packages.find(
			(item) => item.manifest.name === appName,
		);
		if (!app) throw new Error(`Preview app package not found: ${appName}`);
		this.app = app;
		this.configs = [...sources.keys()]
			.filter((file) => /(?:^|\/)tsconfig(?:\.[^/]+)?\.json$/.test(file))
			.map((file) => this.config(file));
		this.rules = this.packages.flatMap((owner) =>
			(owner.manifest.mapsight?.preview?.generated ?? []).map((rule) => ({
				...rule,
				directory: owner.directory,
				owner,
			})),
		);
		const guidePath = app.manifest.mapsight?.preview?.guides;
		const source =
			guidePath &&
			(sources.get(relative(app.directory, guidePath)) ??
				metadata.get(relative(app.directory, guidePath)));
		this.guides = source
			? (JSON.parse(source) as Guides)
			: {router: "", pages: {}, scenarios: {}};
		// Without metadata, infer the outer router rather than guessing a conventional filename.
		this.router = this.guides.router
			? relative(app.directory, this.guides.router)
			: ([...sources].find(
					([file, code]) =>
						within(file, app.directory) &&
						/\.[jt]sx$/.test(file) &&
						/\bBrowserRouter\b/.test(code),
				)?.[0] ?? "");
		this.findRoutes();
		for (const [file, code] of sources) {
			if (!runtimeFile(file)) continue;
			for (const specifier of runtimeImports(file, code)) {
				const dependency = this.resolve(file, specifier);
				if (dependency) this.edge(dependency, file);
			}
		}
		for (const rule of this.rules) {
			const outputs = [
				...new Set([...this.forward.keys(), ...this.reverse.keys()]),
			].filter((file) =>
				rule.outputs?.some((output) =>
					within(file, relative(rule.directory, output)),
				),
			);
			const consumers = (rule.consumers ?? []).map((file) =>
				relative(rule.directory, file),
			);
			const tools = (rule.tools ?? []).flatMap((name) =>
				this.packages
					.filter((owner) => owner.manifest.name === name)
					.map((owner) => owner.directory),
			);
			for (const file of sources.keys()) {
				if (!runtimeFile(file)) continue;
				if (
					rule.inputs.some((input) =>
						within(file, relative(rule.directory, input)),
					) ||
					tools.some((tool) => within(file, tool))
				) {
					for (const consumer of [...outputs, ...consumers])
						this.edge(file, consumer);
				}
			}
		}
		// Router ancestors and pathless layouts are the application shell. Page imports stop elsewhere.
		const queue = [this.router, ...this.shells];
		for (let index = 0; index < queue.length; index++) {
			const current = queue[index]!;
			this.shells.add(current);
			for (const importer of this.reverse.get(current) ?? [])
				if (!this.shells.has(importer)) {
					this.shells.add(importer);
					queue.push(importer);
				}
		}
	}
	private config(file: string, seen = new Set<string>()): Config {
		if (seen.has(file))
			throw new Error(`Circular TypeScript config: ${file}`);
		seen.add(file);
		const result = ts.parseConfigFileTextToJson(
			file,
			this.sources.get(file) ?? "{}",
		);
		if (result.error)
			throw new Error(`Cannot parse TypeScript config: ${file}`);
		const raw = result.config as {
			extends?: string;
			compilerOptions?: {
				rootDir?: string;
				outDir?: string;
				baseUrl?: string;
				paths?: Record<string, string[]>;
			};
		};
		const directory = path.dirname(file);
		const parent = raw.extends?.startsWith(".")
			? this.config(
					relative(
						directory,
						raw.extends.endsWith(".json")
							? raw.extends
							: `${raw.extends}.json`,
					),
					seen,
				)
			: {directory};
		const options = raw.compilerOptions ?? {};
		return {
			...parent,
			directory,
			...(options.rootDir
				? {rootDir: relative(directory, options.rootDir)}
				: {}),
			...(options.outDir
				? {outDir: relative(directory, options.outDir)}
				: {}),
			...(options.paths
				? {
						paths: Object.fromEntries(
							Object.entries(options.paths).map(
								([pattern, targets]) => [
									pattern,
									targets.map((target) =>
										relative(
											directory,
											path.join(
												options.baseUrl ?? ".",
												target,
											),
										),
									),
								],
							),
						),
					}
				: {}),
		};
	}
	private sourceFile(base: string): string | undefined {
		const direct = resolveFile(base, this.sources);
		if (direct) return direct;
		for (const config of this.configs) {
			if (
				!config.rootDir ||
				!config.outDir ||
				!within(base, config.outDir)
			)
				continue;
			const source = resolveFile(
				path.join(config.rootDir, path.relative(config.outDir, base)),
				this.sources,
			);
			if (source) return source;
		}
		return this.rules.some((rule) =>
			rule.outputs?.some((output) =>
				within(base, relative(rule.directory, output)),
			),
		)
			? base
			: undefined;
	}
	resolve(file: string, specifier: string): string | undefined {
		specifier = specifier.replace(/^~/, "").split("?")[0]!;
		if (
			specifier.startsWith(".") ||
			(/\.s?css$/.test(file) && !specifier.startsWith("@"))
		) {
			const local = this.sourceFile(
				path.join(path.dirname(file), specifier),
			);
			if (local) return local;
		}
		for (const config of this.configs
			.filter((config) => within(file, config.directory))
			.sort((a, b) => b.directory.length - a.directory.length)) {
			for (const [pattern, targets] of Object.entries(
				config.paths ?? {},
			)) {
				const [prefix, suffix = ""] = pattern.split("*");
				if (
					pattern.includes("*")
						? !specifier.startsWith(prefix!) ||
							!specifier.endsWith(suffix)
						: pattern !== specifier
				)
					continue;
				for (const target of targets) {
					const resolved = this.sourceFile(
						target.replaceAll(
							"*",
							specifier.slice(
								prefix!.length,
								suffix ? -suffix.length : undefined,
							),
						),
					);
					if (resolved) return resolved;
				}
			}
		}
		const owner = this.packages
			.filter((item) => within(file, item.directory))
			.sort((a, b) => b.directory.length - a.directory.length)[0];
		if (specifier.startsWith("#") && owner) {
			const target = matchExport(owner.manifest.imports ?? {}, specifier);
			return target
				? this.sourceFile(relative(owner.directory, target))
				: undefined;
		}
		const dependency = this.packages.find(
			(item) =>
				item.manifest.name &&
				(specifier === item.manifest.name ||
					specifier.startsWith(`${item.manifest.name}/`)),
		);
		if (!dependency) return undefined;
		const subpath = specifier
			.slice(dependency.manifest.name!.length)
			.replace(/^\//, "");
		const exports = dependency.manifest.exports;
		const target =
			(!subpath ? exportTarget(exports) : undefined) ??
			matchExport(
				typeof exports === "object" ? exports : {},
				subpath ? `./${subpath}` : ".",
			) ??
			(!subpath ? dependency.manifest.main : undefined);
		if (target) {
			const base = relative(
				dependency.directory,
				path.join(
					dependency.manifest.publishConfig?.directory ?? ".",
					target,
				),
			);
			const resolved = this.sourceFile(base);
			if (resolved) return resolved;
		}
		return subpath
			? this.sourceFile(relative(dependency.directory, subpath))
			: undefined;
	}
	private edge(dependency: string, importer: string): void {
		if (!this.reverse.has(dependency))
			this.reverse.set(dependency, new Set());
		if (!this.forward.has(importer)) this.forward.set(importer, new Set());
		this.reverse.get(dependency)!.add(importer);
		this.forward.get(importer)!.add(dependency);
	}
	private findRoutes(): void {
		const tree = parse(this.router, this.sources.get(this.router) ?? "");
		const components = new Map<string, string>();
		for (const node of tree.statements) {
			if (
				!ts.isImportDeclaration(node) ||
				!ts.isStringLiteral(node.moduleSpecifier)
			)
				continue;
			const file = this.resolve(this.router, node.moduleSpecifier.text);
			if (!file) continue;
			if (node.importClause?.name)
				components.set(node.importClause.name.text, file);
			const names = node.importClause?.namedBindings;
			if (names && ts.isNamedImports(names))
				for (const element of names.elements)
					components.set(element.name.text, file);
		}
		const visit = (node: ts.Node, parent = "/") => {
			const opening = ts.isJsxElement(node)
				? node.openingElement
				: ts.isJsxSelfClosingElement(node)
					? node
					: undefined;
			if (opening?.tagName.getText(tree) === "Route") {
				let route = parent;
				let component: string | undefined;
				let navigable = false;
				for (const attribute of opening.attributes.properties) {
					if (!ts.isJsxAttribute(attribute)) continue;
					const name = attribute.name.getText(tree);
					if (name === "index") navigable = true;
					if (name === "path") {
						if (
							!attribute.initializer ||
							!ts.isStringLiteral(attribute.initializer)
						)
							return;
						const value = attribute.initializer.text.replace(
							/\/\*$/,
							"",
						);
						route = value.startsWith("/")
							? value
							: path.join(parent, value);
						if (
							!/^\/[a-z0-9/-]*$/.test(route) ||
							route.includes("//")
						)
							return;
						navigable = true;
					}
					if (
						name === "element" &&
						attribute.initializer &&
						ts.isJsxExpression(attribute.initializer)
					) {
						const element = attribute.initializer.expression;
						if (element && ts.isJsxSelfClosingElement(element))
							component = element.tagName.getText(tree);
					}
				}
				const file = component && components.get(component);
				if (file && component) {
					if (navigable)
						this.routes.push({
							...this.guides.pages[component],
							path: route,
							file,
							component,
						});
					else this.shells.add(file);
				}
				if (ts.isJsxElement(node))
					for (const child of node.children) visit(child, route);
				return;
			}
			ts.forEachChild(node, (child) => visit(child, parent));
		};
		visit(tree);
	}
	reaches(file: string, target: string): boolean {
		return this.distance(file, target) !== undefined;
	}
	private distance(file: string, target: string): number | undefined {
		const queue: [string, number][] = [[file, 0]];
		const seen = new Set<string>();
		for (let index = 0; index < queue.length; index++) {
			const [current, depth] = queue[index]!;
			if (current === target) return depth;
			if (seen.has(current)) continue;
			seen.add(current);
			for (const dependency of this.forward.get(current) ?? [])
				queue.push([dependency, depth + 1]);
		}
		return undefined;
	}
	checks(
		route: Route,
		evidence: string,
	): {check: string; distance: number}[] {
		return (route.scenarios ?? []).flatMap((name) => {
			const scenario = this.guides.scenarios[name];
			if (!scenario) return [];
			const distances = scenario.modules.flatMap((specifier) => {
				const module = this.resolve(this.router, specifier);
				const distance = module
					? this.distance(module, evidence)
					: undefined;
				return distance === undefined ? [] : [distance];
			});
			return distances.length
				? [{check: scenario.check, distance: Math.min(...distances)}]
				: [];
		});
	}
	validate(): void {
		knownKeys(
			this.guides,
			["router", "pages", "scenarios", "deprioritize"],
			"review guides",
		);
		if (
			!this.router ||
			!this.sources.has(this.router) ||
			!this.routes.length
		)
			throw new Error(
				"Preview router must resolve to mounted literal routes",
			);
		for (const [component, guide] of Object.entries(this.guides.pages)) {
			knownKeys(
				guide,
				["label", "check", "scenarios", "sample", "note"],
				`guide ${component}`,
			);
			if (guide.sample !== undefined && typeof guide.sample !== "boolean")
				throw new Error(`Guide sample must be boolean: ${component}`);
			const route = this.routes.find(
				(route) => route.component === component,
			);
			if (!route)
				throw new Error(
					`Review guide references an unmounted component: ${component}`,
				);
			if (!guide.label || !guide.check)
				throw new Error(`Missing review label/check: ${component}`);
			for (const name of guide.scenarios ?? []) {
				const scenario = this.guides.scenarios[name];
				if (!scenario)
					throw new Error(`Unknown review scenario: ${name}`);
				if (
					!scenario.modules.some((specifier) => {
						const module = this.resolve(this.router, specifier);
						return module && this.reaches(route.file, module);
					})
				)
					throw new Error(
						`Scenario ${name} is not imported by ${component}`,
					);
			}
		}
		for (const [name, scenario] of Object.entries(this.guides.scenarios)) {
			knownKeys(scenario, ["modules", "check"], `scenario ${name}`);
			if (!scenario.check || !scenario.modules.length)
				throw new Error(`Incomplete review scenario: ${name}`);
			for (const specifier of scenario.modules)
				if (!this.resolve(this.router, specifier))
					throw new Error(
						`Review scenario ${name} references an unresolved module: ${specifier}`,
					);
		}
		for (const specifier of this.guides.deprioritize ?? [])
			if (!this.resolve(this.router, specifier))
				throw new Error(`Unresolved shared module: ${specifier}`);
		for (const rule of this.rules) {
			knownKeys(
				rule,
				[
					"inputs",
					"outputs",
					"consumers",
					"tools",
					"directory",
					"owner",
				],
				"generated dependency",
			);
			if (
				!rule.inputs.length ||
				!(rule.outputs?.length || rule.consumers?.length)
			)
				throw new Error(
					"Generated dependencies need inputs and outputs or consumers",
				);
			for (const input of rule.inputs)
				if (
					![...this.sources.keys()].some((file) =>
						within(file, relative(rule.directory, input)),
					)
				)
					throw new Error(
						`Generated input no longer exists: ${rule.directory}/${input}`,
					);
			for (const consumer of rule.consumers ?? [])
				if (!this.sources.has(relative(rule.directory, consumer)))
					throw new Error(
						`Generated consumer no longer exists: ${consumer}`,
					);
			for (const output of rule.outputs ?? [])
				if (
					![...this.reverse.keys()].some((file) =>
						within(file, relative(rule.directory, output)),
					)
				)
					throw new Error(
						`Generated output is no longer consumed: ${output}`,
					);
			for (const tool of rule.tools ?? [])
				if (
					!this.packages.some(
						(item) => item.manifest.name === tool,
					) ||
					!(
						rule.owner.manifest.dependencies?.[tool] ??
						rule.owner.manifest.devDependencies?.[tool]
					)
				)
					throw new Error(
						`Generated tool is not a workspace dependency: ${tool}`,
					);
		}
	}
}

export function showcaseRoutes(sources: Sources, metadata?: Sources): Route[] {
	return new PreviewProject(sources, undefined, metadata).routes;
}

export function reviewLinks(
	sources: Sources,
	changes: Change[],
	metadata?: Sources,
): ReviewLink[] {
	const project = new PreviewProject(sources, undefined, metadata);
	const candidates = new Map<string, ReviewLink>();
	const evidence = new Map<string, Set<string>>();
	const shared = (file: string) =>
		(project.guides.deprioritize ?? []).some((specifier) => {
			const module = project.resolve(project.router, specifier);
			return module && project.reaches(module, file);
		});
	const add = (route: Route, file: string, distance: number) => {
		if (!evidence.has(route.path)) evidence.set(route.path, new Set());
		evidence.get(route.path)!.add(file);
		const previous = candidates.get(route.path);
		if (
			previous &&
			previous.distance + (shared(previous.evidence) ? 50 : 0) <=
				distance + (shared(file) ? 50 : 0)
		)
			return;
		candidates.set(route.path, {
			...route,
			evidence: file,
			distance,
			label: route.label ?? route.component,
			check:
				route.check ??
				"Open this screen and exercise the changed behavior described in the PR.",
		});
	};
	for (const change of changes)
		for (const file of new Set(
			[change.filename, change.previous_filename].filter(
				(file): file is string => !!file,
			),
		)) {
			if (!runtimeFile(file)) continue;
			const queue: [string, number][] = [[file, 0]];
			const seen = new Set<string>();
			const affected: {route: Route; distance: number}[] = [];
			for (let index = 0; index < queue.length; index++) {
				const [current, distance] = queue[index]!;
				if (seen.has(current)) continue;
				seen.add(current);
				const destinations = project.routes.filter(
					(route) => route.file === current,
				);
				if (destinations.length) {
					for (const route of destinations)
						affected.push({route, distance});
					continue;
				}
				if (project.shells.has(current)) {
					for (const route of project.routes.filter(
						(route) => route.sample,
					))
						affected.push({route, distance: 100});
					continue;
				}
				for (const importer of project.reverse.get(current) ?? [])
					queue.push([importer, distance + 1]);
			}
			const nearest = Math.min(...affected.map((item) => item.distance));
			for (const item of affected.filter(
				(item) => item.distance <= nearest + (nearest === 0 ? 0 : 1),
			))
				add(item.route, file, item.distance);
		}
	const specific = [...candidates.values()].filter(
		(link) => !shared(link.evidence) && link.distance < 100,
	);
	const actionable = specific.filter(
		(link) =>
			link.distance <= 1 ||
			[...evidence.get(link.path)!].some(
				(file) => project.checks(link, file).length,
			),
	);
	const ordered = (
		actionable.length
			? actionable
			: specific.length
				? specific
				: [...candidates.values()]
	).sort((a, b) => a.distance - b.distance || a.path.localeCompare(b.path));
	const result: ReviewLink[] = [];
	const areas = new Set<string>();
	while (ordered.length && result.length < (specific.length ? 6 : 3)) {
		const index = ordered.findIndex(
			(link) =>
				link.distance === ordered[0]!.distance &&
				!areas.has(link.path.split("/")[1] ?? ""),
		);
		const [link] = ordered.splice(index < 0 ? 0 : index, 1);
		const files = [...evidence.get(link!.path)!];
		const focused = files.filter((file) => !shared(file));
		const checks = [
			...new Set(
				(focused.length ? focused : files)
					.flatMap((file) => project.checks(link!, file))
					.sort((a, b) => a.distance - b.distance)
					.map((item) => item.check),
			),
		];
		if (checks.length) link!.check = checks.slice(0, 2).join(" ");
		result.push(link!);
		areas.add(link!.path.split("/")[1] ?? "");
	}
	return result;
}
