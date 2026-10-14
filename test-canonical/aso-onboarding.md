# ASO onboarding cheat-sheet — quentin-eds-test.ca

Goal: onboard the test site to ASO and run the **canonical** audit against the 19 test pages.
Because the site has no organic traffic, the audit's top-pages list is empty — we must feed it the
19 URLs explicitly via `includedURLs` (`PATCH /sites/{siteId}/canonical`).

## Step 1 — Onboard (Slack, #aem-sites-optimizer-automation)
```
@spacecat onboard site https://quentin-eds-test.ca
```
In the modal: Configuration Profile = **demo** (or paid) — both include `canonical`; Delivery Type =
**EDS**; leave IMS Org blank (lands in Sites Internal). Wait for completion, then get the site id:
```
@spacecat get site https://quentin-eds-test.ca
```

## Step 2 — Feed the 19 URLs to the canonical audit (API)
`PATCH /sites/{siteId}/canonical` with `replaceIncludedURLs: true`. Replace $TOKEN and $SITE_ID:
```bash
curl -X PATCH "https://spacecat.experiencecloud.live/api/v1/sites/$SITE_ID/canonical" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "replaceIncludedURLs": true,
    "includedURLs": [
      "https://quentin-eds-test.ca/canonical-clean-control",
      "https://quentin-eds-test.ca/canonical-missing",
      "https://quentin-eds-test.ca/canonical-cross-domain",
      "https://quentin-eds-test.ca/canonical-different-subdomain",
      "https://quentin-eds-test.ca/canonical-wrong-protocol",
      "https://quentin-eds-test.ca/canonical-uppercase-url",
      "https://quentin-eds-test.ca/canonical-relative-url",
      "https://quentin-eds-test.ca/canonical-malformed-url",
      "https://quentin-eds-test.ca/canonical-not-self-referencing",
      "https://quentin-eds-test.ca/canonical-target-4xx",
      "https://quentin-eds-test.ca/canonical-target-redirect",
      "https://quentin-eds-test.ca/canonical-target-noindex",
      "https://quentin-eds-test.ca/canonical-target-5xx",
      "https://quentin-eds-test.ca/canonical-multiple-tags",
      "https://quentin-eds-test.ca/canonical-conflicting-tags",
      "https://quentin-eds-test.ca/canonical-outside-head",
      "https://quentin-eds-test.ca/canonical-no-href",
      "https://quentin-eds-test.ca/canonical-empty-href",
      "https://quentin-eds-test.ca/canonical-modifier-attribute"
    ]
  }'
```

## Step 3 — Enable + run the canonical audit (Slack)
```
@spacecat audit enable https://quentin-eds-test.ca canonical
@spacecat run audit https://quentin-eds-test.ca canonical
```

## Step 4 — Read results
Backoffice UI → site → canonical opportunity/suggestions, or:
```
GET /sites/{siteId}/latest-audit/canonical
```

Note: ASO scrapes with JS rendering, so the injected structural defects (#14–19) are visible.
