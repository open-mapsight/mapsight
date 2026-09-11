# @mapsight/ssr-sidecar

Generic Node 24 HTTP process for Mapsight HTML embed SSR.

Hosts pull `ghcr.io/open-mapsight/ssr-sidecar` and bind-mount their product
`render.js`. The image ships only this process plus a contract stub — never a
host bundle.

npm `@mapsight/ssr-sidecar` is how the image is built and tested. Host stacks
pull the image; they do not `pnpm add` this package.

The current dist-tag is **`beta`**.

## Public contract

| Method | Path         | Response                                     |
| ------ | ------------ | -------------------------------------------- |
| `GET`  | `/health`    | `ok`                                         |
| `POST` | `/v1/render` | JSON `{ v: 1, html, state, pageMeta, meta }` |
| `POST` | `/purge`     | JSON `string[]` of deleted cache keys        |

There is no `POST /render`. Unknown routes return `404`.

`POST /v1/render` accepts:

```json
{
	"preset": "simpleMap",
	"options": {
		"containerId": "mapsight-embed-1"
	}
}
```

Errors are `{ v: 1, error: { code, message } }` with `VALIDATION`,
`BODY_TOO_LARGE`, `RENDER_FAILED`, or `RENDER_TIMEOUT`.

`POST /purge` accepts `{ "urls": ["https://…/file.geojson"] }` or `{}` / no
`urls` to clear all.

Keep the process off public ingress.

## Image

```bash
docker pull ghcr.io/open-mapsight/ssr-sidecar:beta
```

Bind-mount the host `dist-ssr` and point at the product module:

```yaml
services:
    ssr:
        image: ghcr.io/open-mapsight/ssr-sidecar:beta
        environment:
            MAPSIGHT_SSR_MODULE: /host/render.js
        volumes:
            - ${LOCAL_SSR_MOUNT}:/host:ro
        ports:
            - "127.0.0.1:4123:4123"
```

The stub module at `/app/dist/render.js` is the default when nothing is mounted.

## Environment

| Variable                                  | Role                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| `MAPSIGHT_SSR_HOST`                       | Bind address (default `0.0.0.0`)                                               |
| `MAPSIGHT_SSR_PORT`                       | Bind port (default `4123`)                                                     |
| `MAPSIGHT_SSR_MODULE`                     | ESM module exporting `render()` (and optionally `renderEnvelope()`, `purge()`) |
| `MAPSIGHT_SSR_AWAIT_TIMEOUT_MS`           | Read by the product module, not this server                                    |
| `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` | Installed via `http.setGlobalProxyFromEnv`                                     |
| `MAPSIGHT_SSR_HTTP_ORIGINS`               | Comma hosts rewritten `https` → `http` for hairpin fetches                     |

## Develop

```bash
pnpm --filter @mapsight/ssr-sidecar test
pnpm --filter @mapsight/ssr-sidecar typecheck
pnpm --filter @mapsight/ssr-sidecar build
```

Hydration contract:
[SSR and state hydration](https://github.com/open-mapsight/mapsight/blob/main/docs/integration/SSR_HYDRATION.md).
