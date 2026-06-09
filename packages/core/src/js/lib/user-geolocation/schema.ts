import {z} from "zod";

export const userGeolocationConfigSchema = z.unknown();

export type UserGeolocationConfig = z.infer<typeof userGeolocationConfigSchema>;
