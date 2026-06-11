import {z} from "zod/v4";

export type IconVariant = z.infer<typeof IconVariantSchema>;
export const IconVariantSchema = z.stringFormat(
	"mapsight-icon-variant",
	/[a-z]+/,
);

export type IconId = z.infer<typeof IconIdSchema>;
export const IconIdSchema = z.stringFormat("mapsight-icon-id", /[0-9a-z-]+/);

/** Platform ids and legacy names may use camelCase (e.g. bicycleCount). */
export type IconAlias = z.infer<typeof IconAliasSchema>;
export const IconAliasSchema = z.stringFormat(
	"mapsight-icon-alias",
	/[0-9a-zA-Z-]+/,
);

export type LangCode = z.infer<typeof LangCodeSchema>;
export const LangCodeSchema = z.stringFormat("mapsight-lang-code", /[a-z]{2}/);

export type IconGroupName = z.infer<typeof IconGroupNameSchema>;
export const IconGroupNameSchema = z.stringFormat(
	"mapsight-icon-group",
	/[0-9a-z-]+/,
);

export type IconRenderMode = z.infer<typeof IconRenderModeSchema>;
export const IconRenderModeSchema = z.enum(["sprite", "composable"]);

export type IconColors = z.infer<typeof IconColorsSchema>;
export const IconColorsSchema = z.object({
	background: z.string().optional(),
	foreground: z.string().optional(),
});

export type IconMeta = z.infer<typeof IconMetaSchema>;
export const IconMetaSchema = z.object({
	// The label object has dynamic keys for languages (e.g., "de", "en", "en_US")
	// and string values for the text.
	id: IconIdSchema,
	label: z.record(LangCodeSchema, z.string()).optional(),
	aliases: z.array(IconAliasSchema).optional(),
	groups: z.array(IconGroupNameSchema).optional(),
	render: IconRenderModeSchema.optional(),
	colors: IconColorsSchema.optional(),
	// The fallback field is optional.
	fallback: IconIdSchema.optional(),
});

/** Authoring meta entries keyed by icon id (no embedded `id` field). */
export type SourceIconMeta = z.infer<typeof SourceIconMetaSchema>;
export const SourceIconMetaSchema = IconMetaSchema.omit({id: true});

export type MetaData = z.infer<typeof DistMetaDataSchema>;
export const DistMetaDataSchema = z.object({
	name: z.string(),
	version: z.string(),
	copyright: z.string(),
	defaultIcon: IconIdSchema,
	icons: z.array(IconMetaSchema),
});
