# @mapsight/count-aggregator-api

## 1.2.0

### Minor Changes

- 1631abc: Replace removed `bicycleCount` station type with `bicycleSensorTotal` across the OpenAPI contract, UI, showcase demo, and smart-city icon aliases.

## 1.1.0

### Minor Changes

- 0ae0039: Add bucket metric semantics, datetime values queries, and station-type metadata to the OpenAPI client.
- 98e314f: Add station-type unit and precision display for count-aggregator charts from platform metadata.

### Patch Changes

- 4cc9440: Export station type categories from the API client and add `groupStationTypesByCategory` for hub-style UIs.

## 1.0.0

### Major Changes

- 2478d7b: Initial release of the count-aggregator API client: OpenAPI contract, generated Zod schemas, typed fetch client, URL helpers, and fixtures/tests.

    ***
