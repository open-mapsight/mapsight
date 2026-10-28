---
"@mapsight/ui": minor
---

Make collapsed selection details inert, name the details region, and restore focus to the originating list row on close. Keep non-modal details focus trapping opt-in with `featureSelectionInfo.trapFocus` or the component prop.

Scope tool and sheet Escape handling and respect nested dialogs and handled events. BottomSheet adds `dismissOnEscape` (default `"within"`), opt-in `initialFocus` and `restoreFocus`, translated resize and snap labels, and a heading outside the separator that names the region. Hosts should review title/handle styling and opt into focus movement after user actions.
