#!/bin/bash

set -e

cd /home/www/betterdo

# Fetch and compare changes
git fetch
CHANGED=$(git diff --name-only HEAD origin/main)

# Debugging
echo "Changed files:"
echo "$CHANGED"

# Reset and pull latest
git checkout .
git pull origin main

# Install dependencies
yarn install --immutable

# Keeps old hashed assets (for tabs on the previous version) for 7 days.
# Entry points are copied last so they never reference missing assets.
build_app() {
  local staging
  staging=$(mktemp -d)
  yarn workspace app build --outDir "$staging"
  mkdir -p app/dist/assets
  cp -a "$staging/assets/." app/dist/assets/
  find "$staging" -mindepth 1 -maxdepth 1 ! -name assets -exec cp -a {} app/dist/ \;
  find app/dist/assets -type f -mtime +7 -delete
  rm -rf "$staging"
}

# Detect global changes that require full rebuild
GLOBAL_FILES=$(echo "$CHANGED" | grep -E '^(CHANGELOG\.md|package\.json|yarn\.lock|shared/)' || true)

if [ -n "$GLOBAL_FILES" ]; then
  echo "⚠️ Global/shared files changed – running full build"
  yarn build:website
  build_app
  yarn build:api
  pm2 restart betterdo
else
  # Build only what's changed
  if echo "$CHANGED" | grep -q '^website/'; then
    echo "📦 Changes detected in website/ — building..."
    yarn build:website
  else
    echo "✅ No changes in website/"
  fi

  if echo "$CHANGED" | grep -q '^app/'; then
    echo "📦 Changes detected in app/ — building..."
    build_app
  else
    echo "✅ No changes in app/"
  fi

  if echo "$CHANGED" | grep -q '^api/'; then
    echo "📦 Changes detected in api/ — building..."
    yarn build:api
    pm2 restart betterdo
  else
    echo "✅ No changes in api/"
  fi
fi

