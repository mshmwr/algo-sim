#!/usr/bin/env bash
# Build and publish dist/ to the gh-pages branch (GitHub Pages: Deploy from branch → gh-pages / root).
set -euo pipefail
cd "$(dirname "$0")/.."
npm test
npm run build
touch dist/.nojekyll
rev=$(git rev-parse --short HEAD)
origin=$(git remote get-url origin)
name=$(git config user.name || echo deploy)
email=$(git config user.email || echo deploy@localhost)
tmp=$(mktemp -d)
cp -r dist/. "$tmp"
cd "$tmp"
git init -q -b gh-pages
git add -A
git -c user.name="$name" -c user.email="$email" commit -q -m "Deploy $rev"
git push -f "$origin" gh-pages
rm -rf "$tmp"
echo "Deployed $rev to gh-pages"
