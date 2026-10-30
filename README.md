# GATE Recall

The application source and editable recall notes live in this repository. The original full offline edition is attached to release **v1.0.0** as `GATE_Recall_Offline.zip`. The hosted site has newer profile and PYQ-note features that are not in that original release.

Large source PDFs, question images and extracted metadata are restored from the fixed, checksum-verified **v1.0.0** study pack during deployment. The GitHub code archive alone is therefore not the complete offline app. Download the release ZIP for offline use.

A personal GATE study desk, organised as **subject → syllabus topic → PYQ subtopic → original questions**.

## Start studying

To use the original v1.0.0 desktop edition, download and extract **GATE_Recall_Offline.zip** from Releases, then open its top-level `index.html` (or `dist/index.html`) in a desktop browser. No installation, account, API key, server, build step, or subscription is required. Keep the entire `dist` folder together. The downloadable offline edition also includes a top-level `index.html` shortcut to the same app.

1. Choose a subject and expand a topic.
2. Try the recall prompt before revealing it; then read the essential idea.
3. Open **Practise PYQs**, work on paper, and check the source answer key.
4. Mark the result, write a memory cue, and choose Again / Hard / Good / Easy.
5. Use **Daily review** to revisit due concepts and questions.
6. Open the top-right profile menu to change your initials and view **My PYQ notes**, grouped by subject. The menu also contains **Offline & backup** and **Sources & corrections**.

**Original notes** shows the supplied book pages. Tap a question or note image to enlarge it. Search covers concept names, authored notes and extracted question text. Paper, year, question type and progress filters narrow practice. Save topics/questions, revisit mistakes, flag suspected source errors, or reserve 2024–2026 papers for mocks.

## Offline on a phone or tablet

Open the current hosted HTTPS copy. In the profile menu, select **Offline & backup**, choose **Download all study material** and keep the page open until the readiness check succeeds. The complete pack is about 247 MiB. Downloads can be paused and resumed. Add the site to the home screen using the browser menu (Safari: Share → Add to Home Screen). Open it once in the installed app and check offline readiness there as well.

The extracted desktop edition already contains the study material. External community explanations and reference links need internet. Browser storage can be evicted; retain the ZIP as a durable copy.

## Your progress

Progress is stored only in your browser. Use **Export progress** regularly and **Import backup** when changing devices, browsers or website addresses. The local copy and hosted copy have separate storage. Import keeps the more recently updated record for each item. No automatic cloud sync is included. Avoid private/incognito mode for long-term progress. Some browsers restrict storage for local `file://` pages; the app displays a warning if saving fails.

The review schedule is a simple transparent heuristic: Again = 10 minutes; initial Hard = 1 day, Good = 3 days, Easy = 7 days. Later successful reviews extend the interval. It is not FSRS or an adaptive mastery estimate.

## Content and accuracy

- 11 subjects, 472 source subtopics and 3,823 question entries from the three supplied books.
- Entries span 1987–2026: 3,184 CSE, 356 IT, 138 DA, 143 other-paper entries and 2 practice entries. Use the paper filter when studying CSE only.
- This is an index of the supplied collection, not a certification that every historical GATE CSE question is present. Repeated/cross-listed entries may occur.
- The supplied two-page GATE 2027 CS syllabus guides grouping. General Aptitude is additional coverage from the books. Relevant extensions are retained and labelled.
- Each subtopic includes a concise authored theory recap, a recall prompt and answer, and a common pitfall. Original notes and original question images preserve mathematical notation and diagrams.
- 13 specific source-note errors or misleading labels are documented in **Sources & corrections**. This is not an exhaustive audit of every statement.
- Keys are transcribed from the supplied books and have not all been independently verified or re-solved. MCQ/MSQ and usable numerical keys can be checked automatically; descriptive questions and unavailable keys need self-assessment. No complete worked solution set is claimed.
- Some questions share a passage or refer to an earlier item; open the original PDF at the linked page for surrounding context. Extracted searchable text can omit mathematical notation, so the source image is authoritative.

Original books, questions, contributor credits and embedded links are preserved as supplied. This app does not claim ownership of third-party source material. The offline edition includes the source PDFs for personal study.

## GitHub Pages

For the full source repository, the included workflow publishes `dist/`. In the repository, open **Settings → Pages → Build and deployment → Source → GitHub Actions**, then run the **Publish GATE Recall** workflow, or push to `main`.

Alternatively, put the *contents* of `dist/` (or the extracted edition’s `dist/` folder) at the root of an empty repository, including the empty `.nojekyll` file. Set **Settings → Pages → Deploy from a branch → main → / (root)**. Do not upload only the ZIP. All paths are relative, so repository subpaths work without edits. A free Pages site uses a public repository; do not commit progress exports or personal notes.

Official instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Maintain the source

Daily use requires no development tools. The release ZIP contains the complete application. For local development from a clone, first download the original v1.0.0 offline release and run `python3 scripts/restore_pack.py /path/to/v1.0.0/GATE_Recall_Offline.zip`, then `python3 scripts/build_data.py`. `content/volume1.json` through `volume3.json` contain editable topic mappings and recall notes; `content/extracted*.json`, restored from the release pack, contain question metadata. After editing the content, run `python3 scripts/build_data.py`. This rebuilds the catalogue and verifies IDs and asset paths.

To regenerate source crops, place the original `filter1_volume1.pdf`, `filter1_volume2.pdf` and `filter1_volume3.pdf` in `inputs/`, install PyMuPDF and Pillow, and run `python3 scripts/extract_books.py inputs`, followed by `python3 scripts/build_data.py`. Existing rendered image paths are reused. Review extraction warnings before publishing.

Checks: `node scripts/test_core.cjs` and `node scripts/test_offline.cjs`. The latter simulates a network outage and cached PDF range requests. Browser checks cover hierarchy, recall/review scheduling, answer checking, persistent notes, search and original-note rendering. Offline installation is browser-dependent; the included folder is the durable offline fallback.

Architecture: plain HTML, CSS and JavaScript; localStorage for progress; a service worker and Cache API for hosted offline assets. No runtime CDN dependencies, analytics, remote database or AI API. Progress is never included in site updates.
