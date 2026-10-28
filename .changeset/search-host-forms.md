---
"@mapsight/ui": patch
---

Formless host-form search (`uiState.searchRenderForm: false` or `renderForm={false}`) no longer starts an extra request on Enter or the search button; like form mode, it only prevents submitting the host form and leaves the search to the debounced query. Document the mode in [Search inside a host form](https://github.com/open-mapsight/mapsight/blob/main/packages/ui/docs/SEARCH_IN_HOST_FORMS.md).
