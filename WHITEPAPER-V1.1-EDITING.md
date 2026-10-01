# Whitepaper v1.1 — option 3

Local preview: http://127.0.0.1:4173/

## What changed

The homepage and all 36 current article/revision pages use the selected Open Reference design. The original 33 article files are frozen under `src/content/archive-v1`; their original wording and numbers are unchanged. The v1.0 index is `/v1.0`. Existing v1.0 Tokenomics links redirect to the archived chapter. The archive is a local snapshot of the captured original articles, not a claim of a new publication date.

## Edit the new edition

- Shared homepage: `src/components/whitepaper/WhitepaperHome.tsx`.
- English article content: `src/content/whitepaper/<category>/<slug>.html`.
- Traditional Chinese articles: `src/content/whitepaper-tc/<category>/<slug>.html`.
- Interface translations: `src/components/whitepaper/i18n.ts`.
- Shared article renderer: `src/components/whitepaper/WhitepaperDocument.tsx`.
- English route entry points: `src/app/(en)/`; Traditional Chinese: `src/app/tc/`.
- Main chapter labels and destinations: `src/components/whitepaper/navigation.ts`.
- Shared header, full-text search, mobile navigation and chapter outline: `src/components/whitepaper/WhitepaperShell.tsx`.
- Shared bilingual footer, official social links and Cookie information panel: `src/components/whitepaper/WhitepaperFooter.tsx`. Privacy Policy and Media Kit link to the matching-language official main-site pages. Cookie information reflects the whitepaper's own storage behavior; no main-site analytics ID is installed here.
- Shared styles: `src/app/whitepaper.css` (scoped under `.wp-site`).
- Page titles and article mapping: `manifest.json` in each language's content folder.

After changing article content, run `node scripts/sync-whitepaper-content.mjs` to refresh titles, section IDs, outlines and search text in both languages. Append `en` or `tc` to refresh only that language. Keep section IDs identical across translations so the language switch retains the current section. It uses a static HTML parser, runs automatically before builds and does not touch v1.0. Then run `npm run check`. Start preview with `npm run dev -- --port 4173` if it is not already running.

Traditional Chinese preview: http://127.0.0.1:4173/tc/. The header switch preserves the current chapter, query and anchor; chapter navigation and search stay in the selected language. English uses the existing URLs; Traditional Chinese uses `/tc/`, consistent with W3. Both versions expose the original English v1.0 archive. Root layouts render the correct `en` or `zh-Hant` document language.

The initial translation record is in `docs/localization-tc/translations.tsv`. `scripts/build-tc-content.mjs` rebuilds all Chinese articles from that record and the captured templates; it **overwrites later direct HTML edits**, so use it only when intentionally regenerating translations. Normal editing uses the sync command above.

## Editorial boundaries

The website remains **Review Draft**. Visual migration and translation do not approve historic technical or commercial claims. Total supply remains 10 billion MHA; original allocation percentages and the existing Tokenomics revision numbers were preserved. Publication/effective dates have not been assigned. The Traditional Chinese edition covers all 36 current article/revision pages. Product names, command/code examples, addresses and real equations retain their original forms. Three source prose fragments accidentally wrapped in KaTeX are rendered as translated prose; genuine math is unchanged.

## Recovery

The full pre-redesign `src` snapshot is in `docs/redesign-plan/before-option-3/src`. To restore the previous English homepage and article shell, run `powershell -ExecutionPolicy Bypass -File scripts/rollback-whitepaper-option-3.ps1`. It first saves the current entry files, then restores the four recorded files into the current English route group. Chinese routes and content/archives remain on disk; nothing is deleted. The pre-localization snapshot is separately preserved under `docs/localization-tc/before/src`. Review later changes before rolling back.

## Verification

- `scripts/verify-whitepaper-v11.mjs`: desktop/mobile routes, assets, anchors, numeric invariants and exact archive hashes.
- `scripts/check-whitepaper-interactions.mjs`: search, keyboard navigation, copy, section navigation, archive isolation, redirects and responsive layouts.
- `scripts/verify-whitepaper-tc.mjs`: bilingual routes and language switching, Chinese search/menu/clipboard feedback, source and archive hashes, technical-content parity and responsive screenshots.
- `scripts/verify-whitepaper-footer.mjs`: footer link destinations, bilingual responsive layouts, Cookie dialog focus/close, language-record removal, blocked storage and absence of analytics requests/cookies.
- `design-qa.md`: visual comparison and known boundaries.

The independent GitHub repository is jerrysohigh-create/magne-whitepaper. GitHub upload does not constitute production deployment. Recovery paths above are local-only artifacts, not included in a fresh clone.
