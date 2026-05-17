import type {RcFile} from "syncpack";

export default {
	sortPackages: true,
	sortFirst: ["name", "description", "version", "private", "type"],
	indent: "\t",
} satisfies RcFile;
