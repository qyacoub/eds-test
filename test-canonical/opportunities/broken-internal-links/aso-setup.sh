#!/usr/bin/env bash
# ASO setup for the broken-internal-links benchmark.
# Reads a fresh Backoffice JWT from ~/.spacecat-jwt (never pasted into chat).
#   1) sets includedURLs (the 19 scored scenario pages) for the audit
#   2) enables the broken-internal-links audit for the site (config API)
# Then trigger via Slack: @spacecat run audit "$BASE" broken-internal-links
#
# Config comes from the environment (export it, or source your
# ~/.config/opportunity-detect-benchmark/.env first):
#   EDS_HOST           your production host WITHOUT protocol (e.g. example-test.com)
#   SPACECAT_SITE_ID   your site's SpaceCat UUID
set -euo pipefail

API="https://spacecat.experiencecloud.live/api/v1"
SITE_ID="${SPACECAT_SITE_ID:?set SPACECAT_SITE_ID (your site's SpaceCat UUID)}"
BASE="https://${EDS_HOST:?set EDS_HOST (production host without protocol)}"
AUDIT="broken-internal-links"
KEY="$(cat "$HOME/.spacecat-jwt")"

URLS=(
  bil-clean-control bil-anchor-404 bil-soft-404 bil-gone-410 bil-forbidden-403
  bil-server-5xx bil-redirect-chain bil-form-action-404 bil-imagemap-area-404
  bil-iframe-404 bil-broken-image bil-broken-cssjs bil-broken-canonical
  bil-broken-hreflang bil-temp-redirect-302 bil-broken-redirect
  bil-nofollow-internal bil-orphaned-page bil-few-inlinks
)
# Build the includedURLs array cleanly with python to avoid quoting pitfalls.
INCLUDED=$(python3 -c "
import json,sys
base='$BASE'
slugs='''${URLS[*]}'''.split()
print(json.dumps([f'{base}/{s}' for s in slugs]))
")

echo '== 1) PATCH includedURLs =='
curl -s -X PATCH "$API/sites/$SITE_ID/$AUDIT" \
  -H "Authorization: Bearer $KEY" -H 'Content-Type: application/json' \
  -d "{\"replaceIncludedURLs\": true, \"includedURLs\": $INCLUDED}" \
  -w '\nHTTP %{http_code}\n'

echo '== 2) enable audit (config API) =='
curl -s -X PATCH "$API/configurations/sites/audits" \
  -H "Authorization: Bearer $KEY" -H 'Content-Type: application/json' \
  -d "[{\"baseURL\":\"$BASE\",\"auditType\":\"$AUDIT\",\"enable\":true}]" \
  -w '\nHTTP %{http_code}\n'

echo
echo 'Next: in #aem-sites-optimizer-automation ->  @spacecat run audit '"$BASE $AUDIT"
