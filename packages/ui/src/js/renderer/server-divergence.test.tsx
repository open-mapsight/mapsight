// @vitest-environment node
import {renderToString} from "react-dom/server";

import {expect, it, vi} from "vitest";

import BottomSheet from "../components/bottom-sheet";
import LinkShare from "../components/link-share";
import NativeDialog from "../components/native-dialog";

it("renders inline dialogs without a document and omits portals and browser capabilities", () => {
	expect(typeof document).toBe("undefined");
	const html = renderToString(
		<div>
			<NativeDialog isOpen={false} title="Inline" onClose={vi.fn()}>
				Inline content
			</NativeDialog>
			<NativeDialog
				isOpen={false}
				portal
				title="Portal"
				onClose={vi.fn()}
			>
				Portal content
			</NativeDialog>
			<LinkShare
				url="https://example.org"
				onFinished={undefined}
				onError={undefined}
			/>
		</div>,
	);
	expect(html).toContain("Inline content");
	expect(html).not.toContain("Portal content");
	expect(html).not.toContain("ms3-link-share__button");
});

it("does not call viewport-dependent snap factories on the server", () => {
	const snaps = vi.fn(() => [window.innerHeight]);
	const html = renderToString(
		<BottomSheet label="Details" snaps={snaps}>
			Content
		</BottomSheet>,
	);
	expect(snaps).not.toHaveBeenCalled();
	expect(html).toContain("height:240px");
});
