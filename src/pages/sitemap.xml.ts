import type { APIRoute } from "astro";
import { loadIssues, loadSite } from "../lib/model.mjs";

export const GET: APIRoute = () => {
  const site = loadSite();
  const paths = ["/", "/about/", ...loadIssues().map((issue: { slug: string }) => `/issues/${issue.slug}/`)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((pathname) => `  <url><loc>${new URL(pathname, site.url).toString()}</loc></url>`).join("\n")}
</urlset>
`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
