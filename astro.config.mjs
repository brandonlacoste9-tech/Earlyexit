import { readFileSync } from "node:fs";
import { defineConfig } from "astro/config";
import { parse } from "yaml";

const site = parse(readFileSync(new URL("./content/site.yaml", import.meta.url), "utf8"));

export default defineConfig({
  site: site.url,
  trailingSlash: "ignore",
  build: { format: "directory" },
  compressHTML: true,
});
