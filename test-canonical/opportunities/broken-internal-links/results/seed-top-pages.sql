-- Seed SEO top pages for quentin-eds-test.ca (site_id 019e993a-a742-71ba-b61c-8034aebfb74a)
-- Table: public.site_top_pages (data-access v4 / Postgres). id, imported_at, created_at,
-- updated_at, updated_by all use column defaults. 61 rows (all sitemap pages except /nav,/footer).
BEGIN;

-- idempotent: clear any prior seo/global rows for this site so a re-run cannot duplicate
DELETE FROM public.site_top_pages
 WHERE site_id = '019e993a-a742-71ba-b61c-8034aebfb74a' AND source = 'seo' AND geo = 'global';

INSERT INTO public.site_top_pages (site_id, url, traffic, source, geo, top_keyword) VALUES
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/', 100000, 'seo', 'global', 'home'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/about', 99999, 'seo', 'global', 'about'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/alt-text', 99998, 'seo', 'global', 'alt-text'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/alt-text-broken-image', 99997, 'seo', 'global', 'alt-text-broken-image'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/alt-text-empty', 99996, 'seo', 'global', 'alt-text-empty'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/alt-text-generic', 99995, 'seo', 'global', 'alt-text-generic'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/alt-text-long', 99994, 'seo', 'global', 'alt-text-long'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/alt-text-missing', 99993, 'seo', 'global', 'alt-text-missing'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/alt-text-valid-control', 99992, 'seo', 'global', 'alt-text-valid-control'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-anchor-404', 99991, 'seo', 'global', 'bil-anchor-404'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-broken-canonical', 99990, 'seo', 'global', 'bil-broken-canonical'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-broken-cssjs', 99989, 'seo', 'global', 'bil-broken-cssjs'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-broken-hreflang', 99988, 'seo', 'global', 'bil-broken-hreflang'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-broken-image', 99987, 'seo', 'global', 'bil-broken-image'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-broken-redirect', 99986, 'seo', 'global', 'bil-broken-redirect'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-clean-control', 99985, 'seo', 'global', 'bil-clean-control'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-few-inlinks', 99984, 'seo', 'global', 'bil-few-inlinks'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-forbidden-403', 99983, 'seo', 'global', 'bil-forbidden-403'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-form-action-404', 99982, 'seo', 'global', 'bil-form-action-404'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-gone-410', 99981, 'seo', 'global', 'bil-gone-410'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-iframe-404', 99980, 'seo', 'global', 'bil-iframe-404'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-imagemap-area-404', 99979, 'seo', 'global', 'bil-imagemap-area-404'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-index', 99978, 'seo', 'global', 'bil-index'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-nofollow-dest', 99977, 'seo', 'global', 'bil-nofollow-dest'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-nofollow-internal', 99976, 'seo', 'global', 'bil-nofollow-internal'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-orphaned-page', 99975, 'seo', 'global', 'bil-orphaned-page'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-redirect-chain', 99974, 'seo', 'global', 'bil-redirect-chain'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-redirect-ok-dest', 99973, 'seo', 'global', 'bil-redirect-ok-dest'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-server-5xx', 99972, 'seo', 'global', 'bil-server-5xx'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-soft-404', 99971, 'seo', 'global', 'bil-soft-404'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-soft-404-target', 99970, 'seo', 'global', 'bil-soft-404-target'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/bil-temp-redirect-302', 99969, 'seo', 'global', 'bil-temp-redirect-302'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/canonical-clean-control', 99968, 'seo', 'global', 'canonical-clean-control'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/canonical-conflicting-tags', 99967, 'seo', 'global', 'canonical-conflicting-tags'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/canonical-cross-domain', 99966, 'seo', 'global', 'canonical-cross-domain'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/canonical-different-subdomain', 99965, 'seo', 'global', 'canonical-different-subdomain'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/canonical-empty-href', 99964, 'seo', 'global', 'canonical-empty-href'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/canonical-malformed-url', 99963, 'seo', 'global', 'canonical-malformed-url'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/canonical-missing', 99962, 'seo', 'global', 'canonical-missing'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/canonical-modifier-attribute', 99961, 'seo', 'global', 'canonical-modifier-attribute'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/canonical-multiple-tags', 99960, 'seo', 'global', 'canonical-multiple-tags'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/canonical-no-href', 99959, 'seo', 'global', 'canonical-no-href'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/canonical-not-self-referencing', 99958, 'seo', 'global', 'canonical-not-self-referencing'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/canonical-outside-head', 99957, 'seo', 'global', 'canonical-outside-head'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/canonical-relative-url', 99956, 'seo', 'global', 'canonical-relative-url'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/canonical-target-4xx', 99955, 'seo', 'global', 'canonical-target-4xx'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/canonical-target-5xx', 99954, 'seo', 'global', 'canonical-target-5xx'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/canonical-target-noindex', 99953, 'seo', 'global', 'canonical-target-noindex'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/canonical-target-redirect', 99952, 'seo', 'global', 'canonical-target-redirect'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/canonical-target-robots-blocked', 99951, 'seo', 'global', 'canonical-target-robots-blocked'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/canonical-uppercase-url', 99950, 'seo', 'global', 'canonical-uppercase-url'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/canonical-wrong-protocol', 99949, 'seo', 'global', 'canonical-wrong-protocol'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/cc-clean-control', 99948, 'seo', 'global', 'cc-clean-control'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/cc-large-3to1-pass', 99947, 'seo', 'global', 'cc-large-3to1-pass'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/cc-large-below-3', 99946, 'seo', 'global', 'cc-large-below-3'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/cc-link-in-text-block', 99945, 'seo', 'global', 'cc-link-in-text-block'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/cc-normal-below-4-5', 99944, 'seo', 'global', 'cc-normal-below-4-5'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/cc-normal-boundary-pass', 99943, 'seo', 'global', 'cc-normal-boundary-pass'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/cc-text-on-image', 99942, 'seo', 'global', 'cc-text-on-image'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/contact', 99941, 'seo', 'global', 'contact'),
  ('019e993a-a742-71ba-b61c-8034aebfb74a', 'https://quentin-eds-test.ca/robots-blocked-target', 99940, 'seo', 'global', 'robots-blocked-target');

COMMIT;

-- verify: SELECT count(*) FROM public.site_top_pages
--          WHERE site_id = '019e993a-a742-71ba-b61c-8034aebfb74a' AND source='seo' AND geo='global';  -- expect 61
