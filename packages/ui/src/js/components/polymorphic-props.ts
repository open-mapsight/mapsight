import type {ElementType, HTMLAttributes} from "react";

/** Common attributes for components whose host element can be replaced. */
export type PolymorphicProps = HTMLAttributes<HTMLElement> & {
	as?: ElementType;
};
