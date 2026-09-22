import type { APIRoute } from "astro";
import { loadSite } from "../lib/model.mjs";

export const GET: APIRoute = () => {
  const site = loadSite();
  const origin = site.url.replace(/\/$/, "");
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
