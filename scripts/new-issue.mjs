import fs from "node:fs";
import path from "node:path";
import { nextIssueNumber } from "../src/lib/model.mjs";

const number = nextIssueNumber();
const padded = String(number).padStart(3, "0");
const slug = `untitled-${number}`;
const filename = `${padded}-untitled.yaml`;
const dest = path.join(process.cwd(), "content", "issues", filename);

if (fs.existsSync(dest)) {
  console.error(`Refusing to overwrite ${dest}`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const file = `# Draft. Delete the draft line when the issue is ready to publish.
# Required fields: slug, number, title, dek, cover, coverWidth, coverHeight, video, pullQuotes, sections.
# Cover and poster files live in public/ and are referenced by a root path (/images/...).
draft: true
slug: ${slug}
number: ${number}
volume: 1
title: Untitled issue
month:
date: "${today}"
dek: Say what this issue is about in one or two sentences.
cover: /images/covers/placeholder.webp
coverWidth: 1400
coverHeight: 875
coverAlt: Plain dark placeholder. Replace the image and describe what is actually in the picture.
video: https://www.youtube.com/watch?v=VIDEO_ID
pullQuotes:
  - text: Pull one sentence out of the issue.
    attribution: Source of the line
sections:
  - id: letter
    kicker: Editor's letter
    heading: Open the issue here
    paragraphs:
      - Write the section. Copy this block to add another piece.
  - id: film
    kicker: Field note
    heading: Title of the film
    dek: One sentence under the title.
    video: https://www.youtube.com/watch?v=VIDEO_ID
    poster: /images/covers/placeholder.webp
    posterWidth: 1400
    posterHeight: 875
    duration: 0
    views: 0
    pullQuote: Optional line. Remove this key if the issue quotes already say it.
    paragraphs:
      - What the film argues, in a paragraph.
`;

fs.writeFileSync(dest, file, "utf8");
console.log(`Created ${path.relative(process.cwd(), dest)}`);
console.log("It is a draft, so the site will not show it yet.");
console.log("1. Edit the title, dek, video URL, quotes, and sections.");
console.log("2. Put a cover image in public/images/ and point cover: at it.");
console.log("3. Delete the draft: true line.");
console.log("4. Run npm run build.");
