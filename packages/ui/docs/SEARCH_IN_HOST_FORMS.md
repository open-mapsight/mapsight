# Search inside a host form

Search renders a `<form>` by default. Inside a host `<form>` (for example a CMS
form around a point editor) that produces invalid nested forms: the HTML parser
drops the inner `<form>` from server-rendered markup, so hydration replaces the
search, and Enter in the search input submits the host form.

Set `createOptions.uiState.searchRenderForm: false` on both server and client.
SearchOverlay then renders its search as a `div`, including in its mobile dialog.
Direct Search embeddings can use `renderForm={false}`; SearchOverlay also accepts
that prop and it takes precedence over the UI state.

```tsx
const createOptions = {
	uiState: {searchRenderForm: false},
};
```

In this mode the search button is `type="button"` and Enter in the search input
is prevented, so neither submits the host form. As in form mode, the search runs
from the debounced query; Enter and the button do not start an extra request.
Selecting a result keeps focus outside the search when the user has moved on to
another host field. The host's explicit submit button remains usable.

The default remains a search form for existing integrations.

Automated evidence: tests parse a complete outer CMS form, hydrate the real
SearchOverlay without replacing its SSR nodes, select a street result, and check
Enter suppression, the single debounced request, hidden field ownership and
explicit submission. Host CMS integration remains a host release gate.
