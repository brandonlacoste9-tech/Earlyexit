import assert from "node:assert/strict";
import fs from "node:fs";
import { parse } from "yaml";
import { formatDuration, formatViews, loadIssues, loadSite } from "../src/lib/model.mjs";

assert.equal(formatDuration(945), "15:45");
assert.equal(formatDuration(1066), "17:46");
assert.equal(formatDuration(0), "");
assert.equal(formatViews(216604), "217K");
assert.equal(formatViews(7400), "7.4K");
assert.equal(formatViews(8000), "8K");
assert.equal(formatViews(220000), "220K");
assert.equal(formatViews(3_900_000), "3.9M");

const siteFile = new URL("../content/site.yaml", import.meta.url);
const siteFromFile = parse(fs.readFileSync(siteFile, "utf8"));
const site = loadSite();
const issues = loadIssues();

assert.equal(typeof site.title, "string");
assert.ok(site.title.trim().length > 0, "content/site.yaml title is required");
assert.equal(site.title, siteFromFile.title, "site title must come from content/site.yaml");
assert.ok(issues.length >= 1, "publish at least one non-draft issue");
assert.ok(issues.every((issue) => issue.draft !== true), "drafts must stay out of the published catalog");

console.log(`ok · ${site.title} · ${issues.length} published issue(s) · latest is No. ${issues[0].number} ${issues[0].title}`);
