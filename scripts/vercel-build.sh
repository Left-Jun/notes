#!/usr/bin/env bash
set -euo pipefail

HUGO_VERSION="${HUGO_VERSION:-0.155.2}"
HUGO_DIR=".vercel/hugo-${HUGO_VERSION}"
HUGO_BIN="${HUGO_DIR}/hugo"
HUGO_ARCHIVE="hugo_extended_${HUGO_VERSION}_Linux-64bit.tar.gz"
HUGO_URL="https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/${HUGO_ARCHIVE}"

case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*)
    hugo --gc --minify
    exit 0
    ;;
esac

if [ ! -x "${HUGO_BIN}" ]; then
  mkdir -p "${HUGO_DIR}"
  curl -fsSL "${HUGO_URL}" -o /tmp/hugo.tar.gz
  tar -xzf /tmp/hugo.tar.gz -C "${HUGO_DIR}" hugo
  chmod +x "${HUGO_BIN}"
fi

"${HUGO_BIN}" --gc --minify
