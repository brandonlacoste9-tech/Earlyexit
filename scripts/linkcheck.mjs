import fs from "node:fs";
import path from "node:path";

const dist = path.join(process.cwd(), "dist");
const htmlFiles = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (fs.statSync(abs).isDirectory()) walk(abs);
    else if (name.endsWith(".html")) htmlFiles.push(abs);
  }
}

walk(dist);
const missing = [];
const pages = new Set(htmlFiles.map((file) => "/" + path.relative(dist, file).replaceAll("\\", "/")));

function resolves(url) {
  const clean = url.split("#")[0].split("?")[0];
  if (clean === "/" || clean === "") return pages.has("/index.html");
  const rel = clean.replace(/^\//, "");
  const candidates = [
    path.join(dist, rel),
    path.join(dist, rel, "index.html"),
    path.join(dist, `${rel}.html`),
  ];
  return candidates.some((candidate) => fs.existsSync(candidate));
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  for (const ref of refs) {
    if (ref.startsWith("http") || ref.startsWith("mailto:") || ref.startsWith("#") || ref.startsWith("data:")) continue;
    const [pathOnly] = ref.split("#");
    if (!resolves(pathOnly)) missing.push(`${path.relative(dist, file)} -> ${ref}`);
  }
  if (html.includes("<iframe")) missing.push(`${path.relative(dist, file)} contains an iframe`);
}

if (missing.length) {
  console.error(missing.join("\n"));
  process.exit(1);
}
console.log(`ok · ${htmlFiles.length} pages · no broken local links · no iframes`);
