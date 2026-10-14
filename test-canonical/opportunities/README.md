# Opportunities — adding a new ASO×SemRush benchmark opportunity

The authoring tool (`../upload-da.mjs`) is opportunity-agnostic. The **canonical** opportunity is the
live "Visiting Montréal" site (`../scenarios.mjs` + `../content.mjs`) and is published with the default
`node test-canonical/upload-da.mjs <host>`. Every **other** opportunity lives in its own folder here and
is published with `--opp <name>`.

## Add an opportunity in 3 steps
1. `cp -r _template <opportunity>` (e.g. `meta-description`, `alt-text`, `links`).
2. Edit `<opportunity>/scenarios.mjs` — one object per planted defect (see the shape in `_template`).
   Optionally add `<opportunity>/content.mjs` for richer page copy (keyed by slug); it's optional —
   pages render fine from `title` + `body` alone.
3. Publish: `node test-canonical/upload-da.mjs <host> --opp <opportunity>`
   (single page: append the slug, e.g. `--opp meta-description metadesc-missing`).

That's it — the site nav updates itself (see below). No step 4.

## The nav is generated — never hand-edit it
The `/nav` menu is generated from the scenarios by `../gen-nav.mjs`: each opportunity gets its own nested
sub-menu (one link per scenario, `helperPages` skipped). A full `upload-da.mjs --opp <name>` run
republishes the nav automatically, so adding an opportunity makes it appear in the menu with no extra work.
- Regenerate the nav alone: `node test-canonical/upload-da.mjs --nav-only` (or `node gen-nav.mjs`).
- Preview without publishing: `node test-canonical/gen-nav.mjs --dry`.
- Skip the auto-refresh on a publish: add `--no-nav`.
- **Menu labels** are derived from the slug (strip the opportunity prefix, de-kebab, sentence-case). Override
  per scenario with `menuLabel`, per opportunity with `navLabel` (the sub-menu heading) and `slugPrefix`.

## Rules that keep the benchmark clean
- **One isolated defect per page.** The slug names the defect and must be globally unique on the site
  (it's a URL path) — prefix it with the opportunity, e.g. `metadesc-missing`, `alt-empty`.
- **Metadata-expressible defects** go in `scenarios[].metadata` (any keys: `description`, `robots`,
  `keywords`, `og:title`, …). The tool emits one EDS Metadata row per key (HOST_TOKEN resolved).
- **Structural defects** the metadata pipeline can't express (duplicate tags, attributes, element
  placement, injected markup) need a client-side injector like the canonical one
  (`../../scripts/canonical-test.js`) wired via `head.html`. Set `inject: true` on those scenarios so
  the tool emits NO metadata for them; the injector mutates the rendered DOM (ASO scrapes rendered DOM;
  SemRush needs JS-rendering ON). This is opportunity-specific and not required for metadata-only opps.
- Keep a clean **control** scenario (no defect) to measure false positives.
- Reference images (if any) by their `content.da.live` source URL in `content.mjs`; pages without an
  image just render the heading + copy.
