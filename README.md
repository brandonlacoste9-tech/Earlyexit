# Early Exit Magazine

A reusable dark editorial magazine. Early Exit is the publication configured in `content/site.yaml`. The next catalog — another volume, another title, a farm catalog — is new data, not new code.

Issue 09, *Leaving Early* (September 2026), is the public catalog from [earlyexit.grok.me](https://earlyexit.grok.me), moved into one YAML file.

## Run it

Requires Node 20 or newer.

```bash
npm install
npm run dev
```

Open http://127.0.0.1:4321/

```bash
npm run check     # validate site.yaml and published issues, no site build
npm run build     # same checks, then writes dist/
npm run preview   # serves dist/ at http://127.0.0.1:4321/
```

Deploy `dist/` to any static host. `netlify.toml` is already set to `npm run build` and `dist`.

## Add an issue in under five minutes

```bash
npm run new-issue
```

That writes `content/issues/010-untitled.yaml` (the number follows whatever is already there). It is a draft, so the site does not show it yet.

1. Edit the title, dek, YouTube URL, pull quotes, and sections.
2. Put a cover image in `public/images/` and point `cover:` at it, for example `/images/covers/spring.webp`. Set `coverWidth` and `coverHeight` to the pixel size. `coverAlt` describes what is in the picture.
3. Delete the `draft: true` line.
4. Run `npm run build`.

If the build fails, run `npm run check`. It validates `content/site.yaml` and the published issues without compiling the site, and the message names the file and the field.

A filename that starts with `_` is also ignored. Required on every published issue:

| Field | What it is |
| --- | --- |
| `slug` | URL piece, lowercase hyphenated. The page is `/issues/<slug>/`. |
| `number` | Positive integer. Unique. |
| `title` | Issue title. |
| `dek` | One or two sentences under the title. |
| `cover` | Root path to a file in `public/`, such as `/images/cover.webp`. |
| `coverWidth`, `coverHeight` | Pixel size of that file. |
| `video` | YouTube URL for the cover film (`watch`, `embed`, `shorts`, or `youtu.be`). |
| `pullQuotes` | At least one `{ text, attribution }`. |
| `sections` | At least one section with `id`, `heading`, and `paragraphs`. |

A section may also carry `kicker`, `dek`, `department`, `role` (`cover`, `featured`, `lead`), `video`, `posterWidth`, `posterHeight`, `duration` (seconds), `views`, `published` (`YYYY-MM-DD`), `pullQuote`, and `chapters` (`{ label, start }` in seconds). `department` must match an `id` in `content/site.yaml`. A section with `video` must also set `poster` to a root path in `public/`, such as `/images/thumbs/film.webp`. Omitting it fails the check with `sections[n].poster is required when video is set`.

The publication name, about page, departments, channel links, and homepage lede live in `content/site.yaml`. Change those to retitle the magazine. Do not edit `src/` to publish.

## Pages

- `/` — issue grid, newest first. The newest issue is the lead card.
- `/issues/<slug>/` — reader. Cover film, pull quotes, contents, and every section. Play and chapter buttons load YouTube only after a click. Nothing embeds an iframe on first paint.
- `/about/` — from `content/site.yaml`.

`/about` and `/about/` both work.

## What the old site was

[earlyexit.grok.me](https://earlyexit.grok.me) was a single-issue React app. Content was compiled into a JavaScript bundle.

- `/` was the issue spread, not a grid.
- `/clip/<slug>` was one page per film (26 films).
- `/archive` filtered those films by department.
- `/desk` was a saved stack in `localStorage`.
- There was no about page.
- The cover was dark and the body was cream paper, set in Newsreader and IBM Plex Sans from Google Fonts.
- Volume 01, number 09, *Leaving Early*, September 2026. Departments: The Exit, The Craft, The Ledger, Essays.

## Decisions

- Static HTML. Astro builds the pages. The browser gets one small stylesheet and, on an issue, one short script that creates a YouTube iframe on click.
- Dark throughout, as requested. System serif and sans, no web fonts, so first paint does not wait on a third party.
- The 26 films are sections of issue 09, not 26 routes. Contents links jump to them. Archive filters and the desk were dropped: filters are the contents list, and the desk was browser-only state a catalog template should not invent.
- Images from the live site were resized to WebP. The homepage cover and the issue hero are preloaded. Other images are lazy.
- `draft: true` keeps a scaffold out of the build, so `npm run new-issue` does not take the current issue offline.
- One theme in CSS. A future catalog does not get a theming system; it gets new YAML. Recolor by editing `src/styles/global.css` if the palette itself should change.

## Proof

Lighthouse 12, mobile simulated throttling and desktop preset, against `npm run preview` on 21 September 2026. Performance and accessibility are both 100 on every page. Layout shift is 0. Blocking time is 0.

| Page | Form | Performance | Accessibility | LCP |
| --- | --- | --- | --- | --- |
| Home | mobile | 100 | 100 | 1.4 s |
| Issue | mobile | 100 | 100 | 1.4 s |
| About | mobile | 100 | 100 | 0.9 s |
| Home | desktop | 100 | 100 | 0.3 s |
| Issue | desktop | 100 | 100 | 0.3 s |
| About | desktop | 100 | 100 | 0.2 s |

Full reports: `proof/lh-home.json`, `proof/lh-issue.json`, `proof/lh-about.json`, and the `*-desktop.json` files next to them.

Screenshots:

- `proof/home-desktop.jpg`
- `proof/home-mobile.jpg`
- `proof/issue-desktop.jpg`
- `proof/issue-desktop-film.jpg` (click-to-play facade, no iframe yet)
- `proof/issue-mobile.jpg`
- `proof/about-desktop.jpg`
- `proof/about-mobile.jpg`

Checked in the browser: every nav link, the issue card, the cover-film jump, Play (iframe appears only then, `youtube-nocookie`, no console errors), a chapter seek to `start=50`, and `/about` without a trailing slash. `node scripts/linkcheck.mjs` reports no broken local assets and no iframe in the built HTML.
