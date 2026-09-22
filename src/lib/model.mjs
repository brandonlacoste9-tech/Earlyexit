import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const root = process.cwd();
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ID = /^[a-z][a-z0-9-]*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const YT_ID = /^[A-Za-z0-9_-]{6,20}$/;

const ROLE_LABEL = {
  cover: "Cover",
  featured: "Featured",
  lead: "Lead essay",
};

export function youtubeId(url) {
  if (typeof url !== "string" || url.trim() === "") return null;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, "");
  let id = "";
  if (host === "youtu.be") id = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
  else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (parsed.pathname === "/watch") id = parsed.searchParams.get("v") ?? "";
    else if (parsed.pathname.startsWith("/embed/")) id = parsed.pathname.split("/")[2] ?? "";
    else if (parsed.pathname.startsWith("/shorts/")) id = parsed.pathname.split("/")[2] ?? "";
  }
  return YT_ID.test(id) ? id : null;
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const remain = total % 60;
  return `${minutes}:${String(remain).padStart(2, "0")}`;
}

export function formatViews(views) {
  if (!Number.isFinite(views) || views <= 0) return "";
  if (views >= 1_000_000) {
    const millions = views / 1_000_000;
    const rounded = millions >= 10 ? Math.round(millions) : Math.round(millions * 10) / 10;
    return `${rounded}M`;
  }
  if (views >= 10_000) return `${Math.round(views / 1000)}K`;
  if (views >= 1000) return `${Math.round(views / 100) / 10}K`;
  return String(Math.round(views));
}

export function formatDate(iso) {
  if (typeof iso !== "string" || !ISO_DATE.test(iso)) return "";
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function issueLabel(issue) {
  const volume = String(issue.volume ?? 1).padStart(2, "0");
  const number = String(issue.number).padStart(2, "0");
  return `Vol. ${volume} · No. ${number}`;
}

export function departmentName(site, id) {
  if (!id) return "";
  return site.departments.find((department) => department.id === id)?.name ?? "";
}

export function contentsKicker(site, section) {
  const name = departmentName(site, section.department);
  const role = ROLE_LABEL[section.role] ?? "";
  if (name && role) return `${name} · ${role}`;
  if (name) return name;
  return section.kicker ?? "";
}

function readYaml(file) {
  return parse(fs.readFileSync(file, "utf8"));
}

function publicFile(urlPath, fail) {
  if (typeof urlPath !== "string" || !urlPath.startsWith("/") || urlPath.includes("\\") || urlPath.includes("..")) {
    fail(`public path must start with / and stay inside public/: ${urlPath}`);
    return;
  }
  const relative = urlPath.replace(/^\/+/, "");
  const abs = path.resolve(root, "public", relative);
  const pub = path.resolve(root, "public");
  const fromPub = path.relative(pub, abs);
  if (fromPub.startsWith("..") || path.isAbsolute(fromPub)) {
    fail(`path escapes public/: ${urlPath}`);
    return;
  }
  if (!fs.existsSync(abs)) fail(`missing file public/${relative}`);
}

function requireString(value, label, fail) {
  if (typeof value !== "string" || value.trim() === "") fail(`${label} is required`);
}

export function loadSite() {
  const file = path.join(root, "content", "site.yaml");
  if (!fs.existsSync(file)) throw new Error("Missing content/site.yaml");
  const site = readYaml(file);
  const errors = [];
  const fail = (message) => errors.push(`content/site.yaml: ${message}`);
  requireString(site?.title, "title", fail);
  requireString(site?.tagline, "tagline", fail);
  requireString(site?.description, "description", fail);
  requireString(site?.language, "language", fail);
  requireString(site?.disclaimer, "disclaimer", fail);
  if (typeof site?.url !== "string" || !/^https:\/\/[^/]+/.test(site.url)) {
    fail("url must be an https origin, for example https://earlyexit.grok.me");
  }
  requireString(site?.home?.heading, "home.heading", fail);
  requireString(site?.home?.lede, "home.lede", fail);
  requireString(site?.about?.heading, "about.heading", fail);
  if (!Array.isArray(site?.about?.paragraphs) || site.about.paragraphs.length === 0) {
    fail("about.paragraphs needs at least one paragraph");
  }
  if (!Array.isArray(site?.links) || site.links.length === 0) fail("links needs at least one link");
  else {
    for (const link of site.links) {
      if (typeof link?.label !== "string" || typeof link?.href !== "string" || !/^https?:\/\//.test(link.href)) {
        fail(`link "${link?.label ?? "?"}" needs a label and an http(s) href`);
      }
    }
  }
  if (!Array.isArray(site?.departments)) fail("departments must be a list");
  if (errors.length) throw new Error(errors.join("\n"));
  return site;
}

function checkIssue(issue, file, fail) {
  if (!issue || typeof issue !== "object") {
    fail("file is empty");
    return;
  }
  if (!SLUG.test(issue.slug ?? "")) fail("slug must be lowercase words separated by hyphens");
  if (!Number.isInteger(issue.number) || issue.number < 1) fail("number must be a positive integer");
  if (issue.volume != null && (!Number.isInteger(issue.volume) || issue.volume < 1)) {
    fail("volume must be a positive integer");
  }
  requireString(issue.title, "title", fail);
  requireString(issue.dek, "dek", fail);
  if (issue.date != null && !ISO_DATE.test(issue.date)) fail("date must be YYYY-MM-DD");
  publicFile(issue.cover, fail);
  if (!Number.isInteger(issue.coverWidth) || issue.coverWidth < 1) fail("coverWidth must be a positive integer");
  if (!Number.isInteger(issue.coverHeight) || issue.coverHeight < 1) fail("coverHeight must be a positive integer");
  if (issue.hero != null) publicFile(issue.hero, fail);
  if (!youtubeId(issue.video)) fail("video must be a YouTube watch, embed, shorts, or youtu.be URL");
  if (!Array.isArray(issue.pullQuotes) || issue.pullQuotes.length === 0) fail("pullQuotes needs at least one quote");
  else {
    issue.pullQuotes.forEach((quote, index) => {
      if (typeof quote?.text !== "string" || quote.text.trim() === "") fail(`pullQuotes[${index}].text is required`);
    });
  }
  if (!Array.isArray(issue.sections) || issue.sections.length === 0) fail("sections needs at least one section");
  else {
    const ids = new Set();
    issue.sections.forEach((section, index) => {
      const label = `sections[${index}]`;
      if (!ID.test(section?.id ?? "")) fail(`${label}.id must start with a letter and use lowercase, numbers, or hyphens`);
      else if (ids.has(section.id)) fail(`${label}.id "${section.id}" is duplicated`);
      else ids.add(section.id);
      requireString(section?.heading, `${label}.heading`, fail);
      if (!Array.isArray(section?.paragraphs) || section.paragraphs.some((paragraph) => typeof paragraph !== "string" || paragraph.trim() === "")) {
        fail(`${label}.paragraphs must be a list of non-empty strings`);
      }
      if (section?.video != null && !youtubeId(section.video)) fail(`${label}.video must be a YouTube URL`);
      if (section?.video != null) publicFile(section.poster, fail);
      if (Array.isArray(section?.chapters)) {
        section.chapters.forEach((chapter, chapterIndex) => {
          if (typeof chapter?.label !== "string" || chapter.label.trim() === "") {
            fail(`${label}.chapters[${chapterIndex}].label is required`);
          }
          if (!Number.isInteger(chapter?.start) || chapter.start < 0) {
            fail(`${label}.chapters[${chapterIndex}].start must be a whole number of seconds`);
          }
        });
      }
    });
  }
}

function issueFiles() {
  const dir = path.join(root, "content", "issues");
  if (!fs.existsSync(dir)) throw new Error("Missing content/issues/");
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".yaml") || name.endsWith(".yml"))
    .filter((name) => !name.startsWith("_"))
    .sort()
    .map((name) => ({ name, file: path.join(dir, name) }));
}

export function loadIssues({ includeDrafts = false } = {}) {
  const site = loadSite();
  const departmentIds = new Set((site.departments ?? []).map((department) => department.id));
  const errors = [];
  const parsed = [];
  for (const entry of issueFiles()) {
    let issue;
    try {
      issue = readYaml(entry.file);
    } catch (error) {
      errors.push(`${entry.name}: ${error.message}`);
      continue;
    }
    const draft = issue?.draft === true;
    if (draft && !includeDrafts) {
      parsed.push({ issue, name: entry.name, draft: true });
      continue;
    }
    const local = [];
    checkIssue(issue, entry.name, (message) => local.push(`${entry.name}: ${message}`));
    if (!draft) {
      for (const section of issue?.sections ?? []) {
        if (section?.department != null && !departmentIds.has(section.department)) {
          local.push(`${entry.name}: unknown department "${section.department}" (add it to content/site.yaml)`);
        }
      }
    }
    errors.push(...local);
    parsed.push({ issue, name: entry.name, draft });
  }

  const slugs = new Map();
  const numbers = new Map();
  for (const entry of parsed) {
    const slug = entry.issue?.slug;
    const number = entry.issue?.number;
    if (typeof slug === "string") {
      if (slugs.has(slug)) errors.push(`${entry.name}: slug "${slug}" is also used by ${slugs.get(slug)}`);
      else slugs.set(slug, entry.name);
    }
    if (Number.isInteger(number)) {
      if (numbers.has(number)) errors.push(`${entry.name}: number ${number} is also used by ${numbers.get(number)}`);
      else numbers.set(number, entry.name);
    }
  }
  if (errors.length) throw new Error(errors.join("\n"));

  return parsed
    .filter((entry) => !entry.draft)
    .map((entry) => entry.issue)
    .sort((a, b) => b.number - a.number || String(b.date ?? "").localeCompare(String(a.date ?? "")));
}

export function nextIssueNumber() {
  let max = 0;
  for (const entry of issueFiles()) {
    const issue = readYaml(entry.file);
    if (Number.isInteger(issue?.number) && issue.number > max) max = issue.number;
  }
  return max + 1;
}
