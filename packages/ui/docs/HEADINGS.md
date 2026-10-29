# Heading hierarchy

`@mapsight/ui` can derive native `h1`–`h6` elements from the position of an instance in its host page.
Contextual headings are the default in v8:

```ts
createOptions: {
	headings: {baseLevel: 2},
}
```

`baseLevel` is the **first heading rank inside Mapsight**, not the surrounding heading's rank. It defaults to `2`. Use `2` directly beneath the host's `h1`, or `3` within an existing `h2` section.
Choose the level from the document structure, rather than the last heading elsewhere on the page.

Automatic heading resolution is standard in v8; `createOptions.future` is removed.
Keep `headings` configuration for page placement and exceptional elements.

## CMS embeds

For a map directly below the host page's `h1`, with the CMS supplying the title:

```ts
const createOptions = {
	headings: {baseLevel: 2},
	uiState: {
		pageTitle: {show: false},
		list: {renderGroupAs: "auto"},
	},
};
```

Layer/tag switcher sections, search result groups, list groups, and independent details panels start at `h2`.
Split-mode overlay groups are children of their section heading and use `h3`.

When `pageTitle.show` is true and the title is nonempty, the Mapsight title takes the base rank and the rest of
`App` starts one rank deeper. The default title remains available to screen readers at desktop
sizes where legacy styles visually hide it. An absent or empty title introduces no extra depth.

## Composed React hosts

The default renderers and `<Instance>` share the same instance-scoped provider. Set the options on the instance,
then use `HeadingLevel` inside it wherever the host supplies additional section headings:

```tsx
import Instance from "@mapsight/ui/components/instance";
import LayerSwitcher from "@mapsight/ui/components/layer-switcher/index";
import Search from "@mapsight/ui/components/search/index";
import {HeadingLevel} from "@mapsight/ui/headings";

<Instance
	styleFunction={styleFunction}
	baseMapsightConfig={config}
	createOptions={createOptions}
>
	<h1>City map</h1>
	<HeadingLevel level={3}>
		<section>
			<h2>Search</h2>
			<Search />
		</section>
		<section>
			<h2>Map layers</h2>
			<LayerSwitcher />
		</section>
	</HeadingLevel>
</Instance>;
```

`HeadingLevel` renders no HTML and changes the first rank in its subtree; it applies to every contextual heading below it.
Each new instance resets both the rank and overrides. Several embeds, including nested instances, can use
different configurations without sharing mutable state. React portals retain the originating scope.

## Explicit elements and exceptions

Resolution order is an explicit component element (`headlineAs`, `groupHeadlineAs`, or list `groupAs`), then the
configured slot override, then the contextual rank, then the historical element when automatic headings are off.
Explicit native heading elements also determine the depth of their child content.

```ts
headings: {
	baseLevel: 2,
	overrides: {
		timeFilter: "div",
		featureDetailsTitle: "h3",
	},
}
```

Slot overrides accept `h1`–`h6`, `div`, or `p`. Non-heading elements remain labels: they receive no heading role
and introduce no child depth. Existing component props still accept custom React element types. Their actual
heading rank is opaque; supply a `HeadingLevel` scope explicitly for their content.

| Slot                  | Historical element          | Automatic behavior                                             |
| --------------------- | --------------------------- | -------------------------------------------------------------- |
| `appTitle`            | `h2`                        | Current rank; titled app content advances                      |
| `switcher`            | `h3`                        | Current rank                                                   |
| `switcherGroup`       | `h4`                        | Child of the split-mode section heading                        |
| `searchGroup`         | `h4`                        | Current rank; no implicit search heading                       |
| `featureListGroup`    | Explicit `renderGroupAs`    | Current rank when grouping uses `"auto"`                       |
| `featureDetailsTitle` | `h3`                        | Current rank; details content advances                         |
| `timeFilter`          | `h2`                        | Current rank                                                   |
| `toolTitle`           | `h3`                        | Current rank; tool content advances                            |
| `sheetTitle`          | `h2`                        | Current rank; titled sheet content advances                    |
| `dialogTitle`         | `h3` (`NativeDialog`: `h2`) | Modal title: local `h2`; non-modal popover: current rank       |
| `listOptionsTitle`    | `h3`                        | Current rank                                                   |
| `listOptionsSection`  | `h4`                        | Child of the list-options title; filter content advances again |

### Feature-list grouping

`uiState.list.renderGroupAs` also controls whether grouping is enabled. Keep those choices explicit:

- `"auto"` enables grouping with contextual headings .
- An existing tag such as `"h3"` or `"div"` remains an explicit element override.
- Falsy values continue to disable grouping.

Hosts currently using `"h3"` must change that value to `"auto"` to adopt relative list-group headings. The low-level
`FeatureListGroupedContent` component supports the same values through `groupAs`.

## Dialogs, regions, and replacement components

Actual modal shells (`Modal`, `NativeDialog`, and the share-link modal) use a local `h2` title.
Titled modal content starts at `h3`; a titleless native dialog starts its content at `h2`. Dialog names and heading
IDs retain their existing associations. Non-modal `PopoverDialog`, list-options popovers, tools, selection panels,
and `BottomSheet` remain relative to the page scope. A portal or `role="region"` does not reset a document outline.

Custom headers and component overrides can use the same primitives:

```tsx
import {Heading} from "@mapsight/ui/headings";

function CustomTitle({id, headlineAs}) {
	return (
		<Heading id={id} as={headlineAs} headingSlot="featureDetailsTitle">
			Place details
		</Heading>
	);
}
```

`Heading` forwards native attributes and refs. `useHeadingLevel()` returns the contextual rank. `useHeadingElement(slot, explicitAs)` resolves
an element with the same precedence as built-in headings. `HeadingContent headingAs="h3"` advances its children
to `h4`; a label or an opaque custom element introduces no depth.

Replacement `TitleBar` and `FeatureSelectionInfoHeader` components must honor the supplied `headlineAs` and `id`
contracts, or configure the corresponding slot as a non-heading and establish their own child scopes. When a sheet
already names the selected place, suppress a duplicate inner title using `headlineAs="div"` as appropriate.
Arbitrary host HTML, feature descriptions, and hard-coded headings inside replacements are not rewritten.

## SSR and limits

Pass identical `headings` options on the server and client. `data-dehydrated-state` contains Redux state;
it does **not** serialize these create options. A custom renderer should spread its renderer props onto `AppContext`
on both sides. Heading selection never reads the surrounding DOM, viewport dimensions, or computed styles.

Configured ranks must be integers from 1 to 6. Invalid ranks or override elements throw at the provider boundary.
Derived child ranks stop at `h6`, with a development warning when a section would exceed that depth. Flatten the
content structure in that case; a native six-level hierarchy cannot represent unlimited nesting.

Audit the complete page with overlays open as well as closed. Correct ranks inside Mapsight cannot guarantee the
structure of the surrounding host page or the DOM order of arbitrary portaled content. Passing axe's `heading-order`
rule alone does not establish a meaningful hierarchy. See [WAI heading guidance](https://www.w3.org/WAI/tutorials/page-structure/headings/).
