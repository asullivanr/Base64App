# Base64App

Base64App is a lightweight web application for encoding and decoding UTF-8 text with Standard or URL-safe Base64. Conversion runs entirely in your browser, with no accounts, saved history, or conversion requests to a server. Base64 is encoding, not encryption.

The interface uses plain HTML, CSS, and JavaScript. You can run it locally with Node.js or deploy the static application with the included Docker and Nginx configuration.

## Install and run locally

You need Node.js 22 or later with npm. Clone this repository or download and extract its ZIP archive, then open a terminal in the project folder containing `package.json`.

Check your installation:

```sh
node --version
npm --version
```

Start the application:

```sh
npm start
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser. Press `Ctrl+C` in the terminal to stop the server. If port 3000 is already in use, stop the other service before starting this application.

No application dependencies or build step are required, so you can skip `npm install`.

## Use the converter

1. Choose **Encode** or **Decode**.
2. Select **Standard** or **URL-safe** Base64.
3. Enter or paste your input and click **Convert**.
4. Click **Copy output** to copy the result, or **Clear** to empty the text fields.

For example, encoding `Hello` produces `SGVsbG8=`. Decoding `SGVsbG8=` returns `Hello`. Unicode text, including emoji, is supported. The application converts text; decoded binary data that is not valid UTF-8 is rejected.

URL-safe encoding replaces `+` and `/` with `-` and `_` and retains trailing `=` padding. Decoding accepts input with or without padding and ignores ASCII whitespace. Choose the variant that matches your input's alphabet.

Copy output requires HTTPS or a trusted local address such as `localhost` or `127.0.0.1`. If clipboard access fails, select the result and copy it manually.

## Deploy with Docker

Install Docker with Docker Compose support and enable Linux containers. Run the following commands from the project directory:

```sh
docker compose build --pull
docker compose up -d
docker compose ps
docker compose port base64 80
```

By default, Docker publishes the application on `127.0.0.1` using an automatically assigned host port. For example, if the last command prints `127.0.0.1:49153`, open `http://127.0.0.1:49153/` on the Docker host. The assigned port can change when the container is recreated.

To choose a stable port, create a `.env` file beside `compose.yaml`:

```dotenv
HOST_BIND=127.0.0.1
HOST_PORT=8080
```

Apply the configuration:

```sh
docker compose up -d --force-recreate
```

You can then open [http://127.0.0.1:8080](http://127.0.0.1:8080) on the Docker host. Choose another port if 8080 is occupied. The `.env` file is local configuration and is excluded from Git; create it yourself when needed.

The container serves HTTP on port 80 through Nginx, runs as a non-root user, uses a read-only root filesystem, and stores temporary files in a 64 MiB memory filesystem. It includes a health check and an `unless-stopped` restart policy. No persistent application volumes are required.

### Make the application available over HTTPS

For a public installation, configure your reverse proxy to provide HTTPS and forward requests to the application's HTTP endpoint. Serve the application at the domain root.

- A proxy running directly on the Docker host can use `http://127.0.0.1:8080` with the example configuration above.
- A proxy on another machine needs a reachable address on the Docker host. Set `HOST_BIND` to the host's appropriate network address and allow access through its firewall.
- A proxy in a container on a shared Docker network can use `http://base64:80`. Attach both services to that network; the included Compose file does not configure an external proxy network.

Use an address reachable from your proxy's environment. Verify that the public HTTPS page loads and that **Copy output** works after configuring the proxy.

### Optional: load static content from GitHub

The container serves the bundled Base64App by default. It can instead download a static site from a public GitHub repository whenever it starts. To enable this, add the following settings to your local `.env` file, replacing the repository and reference values:

```dotenv
SITE_GITHUB_URL=https://github.com/OWNER/REPO
SITE_GITHUB_REF=main
SITE_SUBDIR=public
```

Then recreate the container:

```sh
docker compose up -d --force-recreate
```

`SITE_GITHUB_REF` accepts a branch, tag, or commit and defaults to `HEAD`. `SITE_SUBDIR` defaults to `.`; use `public` for this project's layout. The selected folder must contain `index.html` and ready-to-serve assets. The container does not run build commands. Private repositories and repositories containing symbolic links are unsupported.

A failed download or invalid site folder stops startup. Downloaded archives and extracted content share the 64 MiB temporary filesystem; increase its size in `compose.yaml` if necessary. The policies in `nginx.conf` also apply to imported sites, so sites needing external assets, APIs, or inline scripts or styles may require configuration changes. Remove `SITE_GITHUB_URL` and recreate the container to return to the bundled application.

### Update and stop

After obtaining updated source, rebuild and start the application:

```sh
docker compose build --pull
docker compose up -d
docker compose ps
```

Check diagnostics with:

```sh
docker compose logs --tail=100 base64
```

Verify the page and clipboard behavior after updates. If you use an automatically assigned host port, check it again with `docker compose port base64 80` and update your proxy configuration if necessary.

Stop and remove the container with:

```sh
docker compose down
```

## Behavior and privacy

- Conversion happens when you click **Convert**. Editing input or changing selectors clears the previous result.
- Encoding accepts up to 1 MiB of UTF-8 input. Decoding accepts up to 2 MiB of raw UTF-8 input, including whitespace. Oversized input is rejected rather than truncated.
- Decoding rejects the wrong alphabet, malformed padding, nonzero unused padding bits, and invalid UTF-8. A UTF-8 byte order mark is preserved.
- **Clear** retains your selected operation and variant and returns focus to the input.
- The application has no analytics, remote assets, cookies, persistent browser storage, or service workers. Input and output stay in page memory. Page lifecycle handlers clear the fields during refresh and history navigation; browser session or crash recovery behavior may vary.

## Project structure and development

| Path | Purpose |
| --- | --- |
| `public/index.html` | Converter page and controls |
| `public/style.css` | Styling and responsive layout |
| `public/app.js` | Form interactions, clipboard actions, and page reset behavior |
| `public/conversion.js` | UTF-8 conversion, Base64 validation, and input limits |
| `scripts/serve.mjs` | Local development server |
| `scripts/container-start.sh` | Container startup and optional GitHub download |
| `Dockerfile` | Nginx container image definition |
| `compose.yaml` | Container settings and host port configuration |
| `nginx.conf` | Static hosting and HTTP response headers |
| `package.json` | Node.js requirements and npm commands |

To change the interface or conversion logic, edit the files in `public/`, run `npm start`, and refresh your browser. Rebuild the container to include source changes in a Docker deployment.

Test suites, browser-check scripts, validation reports, and planning documents are excluded by `.gitignore` and are not included in this repository. The `npm test` command invokes Node's test runner, but this checkout does not include the project's excluded test files. You can manually check a change by encoding and decoding `Hello` and Unicode text, trying both variants, and checking Copy output and Clear.
