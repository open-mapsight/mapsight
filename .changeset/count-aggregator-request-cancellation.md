---
"@mapsight/count-aggregator-api": minor
"@mapsight/count-aggregator-ui": patch
---

Support request cancellation. Client endpoint calls accept an optional `signal`, and the typed helpers accept `{signal}` request options. The count-aggregator UI hooks pass React Query's abort signal so superseded or unmounted queries cancel their requests.
