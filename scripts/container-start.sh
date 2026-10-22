#!/bin/sh
set -eu

fail() { echo "Site startup: $*" >&2; exit 1; }

# All writes stay in the tmpfs so nginx can run without root privileges.
work=$(mktemp -d /tmp/site-import.XXXXXX)
trap 'rm -rf "$work"' EXIT
mkdir "$work/content"

if [ -n "${SITE_GITHUB_URL:-}" ]; then
    repo=${SITE_GITHUB_URL%/}
    repo=${repo%.git}
    case "$repo" in
        https://github.com/*) repo=${repo#https://github.com/} ;;
        *) fail "SITE_GITHUB_URL must be https://github.com/OWNER/REPO" ;;
    esac
    owner=${repo%%/*}
    name=${repo#*/}
    case "$owner" in ''|*[!A-Za-z0-9_-]*) fail "Invalid GitHub owner" ;; esac
    case "$name" in ''|.|..|*[!A-Za-z0-9_.-]*) fail "Invalid GitHub repository" ;; esac
    ref=${SITE_GITHUB_REF:-HEAD}
    case "$ref" in *[!A-Za-z0-9_./-]*|/*|*..*) fail "Invalid GitHub ref" ;; esac
    subdir=${SITE_SUBDIR:-.}
    case "$subdir" in /*|..|../*|*/../*|*/..) fail "SITE_SUBDIR must stay inside the repository" ;; esac
    echo "Site startup: downloading GitHub site content"
    wget -q -T 30 -O "$work/site.tar.gz" "https://codeload.github.com/$owner/$name/tar.gz/$ref" \
        || fail "GitHub download failed (public repositories only)"
    tar -xzf "$work/site.tar.gz" -C "$work/content" --strip-components=1 \
        || fail "Cannot extract GitHub archive"
    # Do not expose symlinks that could point outside the downloaded site.
    [ -z "$(find "$work/content" -type l -print -quit)" ] || fail "Repository contains symbolic links"
    source="$work/content/$subdir"
else
    source=/usr/share/nginx/html
fi

[ -f "$source/index.html" ] || fail "Site folder must contain index.html; check SITE_SUBDIR"
rm -rf /tmp/site
mkdir -p /tmp/site
cp -R "$source/." /tmp/site/
rm -rf "$work"
trap - EXIT
echo "Site startup: ready"
exec "$@"
