import assert from "node:assert/strict";
import { formatDuration, formatViews, loadIssues, loadSite } from "../src/lib/model.mjs";

assert.equal(formatDuration(945), "15:45");
assert.equal(formatDuration(1066), "17:46");
assert.equal(formatDuration(0), "");
assert.equal(formatViews(216604), "217K");
assert.equal(formatViews(7400), "7.4K");
assert.equal(formatViews(8000), "8K");
assert.equal(formatViews(220000), "220K");
assert.equal(formatViews(3_900_000), "3.9M");

const site = loadSite();
const issues = loadIssues();
assert.ok(issues.length >= 1, "publish at least one issue");
const issue = issues.find((item) => item.number === 9);
assert.ok(issue, "issue 9 must stay in the catalog");
assert.equal(issue.slug, "leaving-early");
assert.ok(issue.sections.length >= 27, "issue 9 should keep every clip from the live catalog");
assert.equal(site.title, "Early Exit");

console.log(`ok · ${issues.length} published issue(s) · latest is No. ${issues[0].number} ${issues[0].title}`);
