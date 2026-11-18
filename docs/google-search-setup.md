# Google Search setup

Canonical site: https://www.williamsfacility.com

## Implemented

- Build-time rendered HTML for every public page in all 12 languages.
- Page titles, descriptions, canonical URLs, reciprocal hreflang links and German x-default.
- Sitemap: https://www.williamsfacility.com/sitemap.xml (96 public URLs).
- Crawl rules: https://www.williamsfacility.com/robots.txt.
- LocalBusiness, WebSite, WebPage, service and breadcrumb structured data using the supplied address and email. No invented phone, reviews or opening hours.
- Open Graph and social sharing metadata.
- Noindex for admin, checkout, draft legal documents and error pages. Admin remains authenticated separately. Draft legal documents can be reconsidered for indexing after completion and review.
- Static file routing with a real 404 for missing URLs, permanent root-to-German redirect, and permanent old-Vercel-host-to-custom-domain redirect.

## Owner action required

1. Open https://search.google.com/search-console using the business owner's Google account.
2. Look for `https://www.williamsfacility.com/` in the property selector. If absent, add a **URL-prefix** property with this exact URL.
3. Choose **HTML tag** verification and copy the value of the `google-site-verification` content attribute.
4. Set that token as the `GOOGLE_SITE_VERIFICATION` production environment variable in Vercel and redeploy, or supply the public token to the developer. It is not a Google password. Retain the tag after verification.
5. Click **Verify** in Search Console.
6. Open **Sitemaps** and submit `sitemap.xml`.
7. Use **URL inspection** on `https://www.williamsfacility.com/de` and `/de/cleaning`, run the live test, then **Request indexing**.

Search Console requests require an authorized Google account. Indexing and ranking are Google's decisions. Monitor Search Console's Pages report.

Local checks: `npm run build`, `npm run test:seo`. `VITE_SITE_URL` must be the real canonical HTTPS origin; the default is the domain above. `GOOGLE_SITE_VERIFICATION` is optional until the owner provides the verification token.

Google documentation: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap and https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
