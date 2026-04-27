#!/bin/sh
# Pre-push hook — runs lint + build before any push reaches GitHub/Cloudflare.
# Installed automatically via the "prepare" npm script on npm install.

echo "▶ Pre-push: lint..."
npm run lint || exit 1

echo "▶ Pre-push: build..."
npm run build || exit 1

echo "✅ Pre-push checks passed"
