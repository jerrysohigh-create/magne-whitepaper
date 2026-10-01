# Traditional Chinese edition

Local URL: http://127.0.0.1:4173/tc/

All 36 current article/revision pages have a Traditional Chinese counterpart. EN / 繁體中文 is available in the desktop and mobile header. Switching retains the current chapter, query parameters and section ID. Search, chapter navigation, outlines, code-copy feedback and wallet prompts use the selected language. The v1.0 archive remains the original English edition.

## Editing

- Edit Chinese articles in `src/content/whitepaper-tc/`; English stays in `src/content/whitepaper/`.
- Edit interface wording in `src/components/whitepaper/i18n.ts`.
- Run `node scripts/sync-whitepaper-content.mjs tc` after Chinese HTML edits to refresh titles, outlines and search. Without the final language argument it refreshes both languages.
- Preserve IDs and technical code/examples across languages. Historical dates are not translation dates.
- `before/src` is the source snapshot taken before localization.

## Initial translation record

`segments.json` and `templates/` record the captured English source. `translations.tsv` contains the initial manual translation units. `coverage.json` records 1,431 resolved units over 36 documents and corresponding hashes. Retained identifiers, code and equations are intentional. Three exact source prose fragments accidentally wrapped in KaTeX were translated as normal prose; actual equations are unchanged.

`scripts/build-tc-content.mjs` regenerates the Chinese HTML from this record. This is a deliberate rebuild tool: it overwrites subsequent direct Chinese HTML edits. Normal editing uses the sync script instead.

One-shot migration helpers (`extract-tc-segments.mjs`, `integrate-tc.py`, `integrate-tc-routes.py`, `localize-document-interactions.py`) are historical implementation records, not update commands.

## Checks

Run `node scripts/verify-whitepaper-tc.mjs` with the local preview running, followed by `npm run check`. Browser checks exercise both languages, compare protected content and frozen source hashes, and record screenshots/results under `qa/`. No production publication or GitHub push is included.
