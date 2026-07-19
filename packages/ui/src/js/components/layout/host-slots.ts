/**
 * Module augmentations for host-replaceable layout slots used by pre-OSS embeds.
 *
 * @deprecated Host layout slot replacements are a migration aid. Prefer
 *   composing UI outside replaceable slots where practical. Slot contracts may
 *   change or shrink in the next major of `@mapsight/ui`.
 */
import type {ComponentType, PropsWithChildren, ReactNode} from "react";

declare module "../../helpers/components" {
	interface ComponentProps {
		/** Rendered at the start of the app wrapper (mobile chrome, etc.). */
		AppWrapperStart: Record<string, never>;
		/**
		 * Body of the additional container (list region). Default wraps children
		 * in `.ms3-additional-container__content`.
		 */
		AdditionalContainerContent: PropsWithChildren<{
			as?:
				| keyof HTMLElementTagNameMap
				| ComponentType<{className?: string}>;
			className?: string;
			children?: ReactNode;
		}>;
	}
}

export {};
