import {z} from "zod";

/** Recursive serializable JSON value used in ol-proxy options. */
export type OptionValue =
	| string
	| boolean
	| number
	| ReadonlyArray<OptionValue>
	| Array<OptionValue>
	| Options
	| undefined
	| null;

export type Options = {[k: string]: OptionValue};

export const optionValueSchema: z.ZodType<OptionValue> = z.lazy(() =>
	z.union([
		z.string(),
		z.boolean(),
		z.number(),
		z.null(),
		z.undefined(),
		z.array(optionValueSchema),
		z.record(z.string(), optionValueSchema),
	]),
);

export const optionsSchema = z.record(z.string(), optionValueSchema);
