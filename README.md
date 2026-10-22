# Base64

A static text encoder/decoder. Conversion uses UTF-8 and runs entirely in the browser. It supports Standard and URL-safe Base64, strict decoding, optional input padding, and ASCII whitespace in encoded input. Base64 is encoding, not encryption.

## Local development

Install Node.js 22 or later. No application dependencies or build step are required.

```sh
npm start
```

Open http://127.0.0.1:3000. Run conversion checks with `npm test`.

For optional browser checks, install Playwright outside the application or make it available through `NODE_PATH`, then run `node scripts/check-browser.mjs`. It starts its own temporary server on port 3000 and uses installed Chrome. Set `BROWSER_CHANNEL=msedge` to check installed Edge instead. Stop an existing dev server first. The check produces `validation-mobile.png` and `validation-desktop.png`. To check a running container instead, set `BASE_URL` to its local URL; this skips starting the development server. The checks include keyboard conversion and Clear navigation.

## Behavior and privacy

- Conversion happens only on Convert. Editing input or selectors clears the old result.
- Encode accepts up to 1 MiB of UTF-8; decode accepts up to 2 MiB of raw UTF-8 input. Content is never truncated.
- Copy is available for nonempty output. Clear retains selectors and focuses input.
- Decode rejects wrong alphabets, malformed padding, nonzero unused bits, and invalid UTF-8; a UTF-8 BOM is preserved.
- Content stays in page memory. There are no analytics, remote assets, storage, cookies, service workers, or conversion requests. Page lifecycle handlers clear application content during history navigation and refresh. Browser session/crash restoration and real mobile behavior still need release verification.

See [core-concept.md](core-concept.md), [build stages](build-stages/README.md), and [validation.md](validation.md).

## Container deployment

Requires Docker Engine with Compose and Linux containers. The Dockerfile selects the official [Nginx Alpine image](https://hub.docker.com/_/nginx/) at `1.30.6-alpine-slim`. The explicit patch tag avoids silently changing Nginx versions; rebuilding with `--pull` refreshes the tag's base layers. Review available patched tags before updates, and pin an image digest when preparing a reproducible release. The image builds and runs successfully on local Docker Desktop using Linux/x86_64 containers. Health, restart, non-root operation, response headers, and Chrome/Edge checks against the container passed. See validation.md.

Build and start from this directory on the server:

```sh
docker compose build --pull
docker compose up -d
docker compose ps
docker inspect --format '{{.State.Health.Status}}' "$(docker compose ps -q base64)"
docker compose port base64 80
```

The service runs as `nginx`, serves HTTP on container port 80, and checks its own root page using local `wget`. Compose sets the container's namespaced `net.ipv4.ip_unprivileged_port_start` to zero so the non-root process can bind port 80 while dropping all Linux capabilities. Its root filesystem is read-only; PID, temporary request paths, and imported site files use a 64 MiB `/tmp` tmpfs. Increase its size in compose.yaml for larger repositories. No persistent volumes are needed. The container uses `unless-stopped` restart behavior. Asset responses carry CSP, no-store, MIME sniffing protection, and referrer headers. Access logging is disabled; diagnostic errors go to stderr. The client never sends conversion data to the server.

Compose defaults to host address `127.0.0.1` and a Docker-assigned host port (`HOST_PORT=0`), forwarding to container port 80. Discover the port with `docker compose port base64 80`; for example, output `127.0.0.1:49153` means the local URL is `http://127.0.0.1:49153/`. Check it with `curl -I` before configuring Pangolin. The assigned host port can change when the container is recreated, so check it and update the Pangolin target after recreation. For a stable route, keep the selected port by setting `HOST_PORT` explicitly. Set `HOST_BIND` and `HOST_PORT` in a local `.env` file, for example:

```dotenv
HOST_BIND=127.0.0.1
HOST_PORT=0
```

### Import site content from GitHub at startup

Set these in a local `.env` file, then run `docker compose up -d --force-recreate`:

```dotenv
SITE_GITHUB_URL=https://github.com/OWNER/REPO
SITE_GITHUB_REF=main
SITE_SUBDIR=public
```

Use a public repository URL (an optional `.git` suffix is accepted). `SITE_GITHUB_REF` accepts a branch, tag, or commit and defaults to `HEAD`, the repository's default branch. `SITE_SUBDIR` defaults to `.` for a site at the repository root; use `public` for this application's layout. The selected folder must contain `index.html` and ready-to-serve static assets. No build commands or repository code run during startup. Private repositories and symbolic links are not supported.

Each container start downloads a fresh GitHub archive over HTTPS using BusyBox wget, extracts it into `/tmp`, and copies the selected folder to nginx's document root. Git is not installed. A failed download, invalid folder, or missing index stops startup instead of serving incomplete content. Without `SITE_GITHUB_URL`, startup serves the bundled application. Downloads and extracted files share the 64 MiB tmpfs, so allow space for both. Existing CSP and HTTP headers also apply to imported sites; sites using external scripts, APIs, or inline styles may need nginx.conf changes.

### Pangolin routing

The deployment server runs Linux. The user confirmed their existing Pangolin setup works and will handle routing through that system; proxy changes are outside this implementation handoff. Actual server architecture, hostname, and target address remain deployment-specific. Deploy at the domain root. Configure Pangolin's existing HTTPS resource to route to HTTP using the arrangement that matches your installation:

- A connector on the Docker host with host-network access can target `http://127.0.0.1:<assigned-host-port>` using the port reported above.
- A connector on another machine needs the Docker host's reachable LAN address and published host port. Set `HOST_BIND` to that LAN address and permit the connector through the host firewall. Its own localhost points to the connector, not the app server.
- For a connector sharing a Docker network, attach the app to that actual external network and target `http://base64:80`; published ports can then be removed. The supplied Compose file does not assume a shared network name.

Keep HTTP inside the container and HTTPS at Pangolin. Verify the public HTTPS page and Copy output before declaring deployment complete. Clipboard access requires a secure context (HTTPS, or localhost for development).

### Maintenance

Inspect health with the command above; inspect diagnostics with `docker compose logs --tail=100 base64`. After updating source or the base tag, run `docker compose build --pull` and `docker compose up -d`. Verify health and public HTTPS again.

Before updating, tag the running image so rollback remains possible:

```sh
docker image tag base64-app:local base64-app:previous
```

To roll back, restore the prior source/configuration, tag `base64-app:previous` as `base64-app:local`, then run `docker compose up -d --no-build --force-recreate`. For archival reproducibility, retain the image ID/digest and source alongside the release. Stop and remove the container with `docker compose down`. No application data needs migration or backup.
