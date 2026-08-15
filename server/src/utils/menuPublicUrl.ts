// No URL-building convention exists elsewhere in the codebase yet (an
// Application's ApplicationSetting.domain is currently just a free-form
// display string — see resolveFrontendApp.ts/frontendController.ts) — this
// is the first place a public content URL is actually assembled from it.
export function buildMenuPublicUrl(domain: string, slug: string, appKey: string): string {
  const base = /^https?:\/\//i.test(domain) ? domain.replace(/\/+$/, "") : `https://${domain}`;
  return `${base}/menu/${slug}?appKey=${encodeURIComponent(appKey)}`;
}
