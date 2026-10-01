# Design QA — Whitepaper v1.1 / selected option 3

final result: passed

## Source and normalization

- Selected visual truth: `docs/redesign-plan/selected-option-3.png`, 1507×1044.
- Actual desktop panel crop: (24,11), 1154×1032. Actual mobile panel crop: (1199,11), 289×1032. The generated board did not use its requested 1440/390 viewport widths.
- Matched browser captures: `qa-option-3/home-desktop-final.png` at 1154×1032 and `home-mobile-final.png` at 289×1032, deviceScaleFactor 1. No geometric stretching. Browser chrome and outer board excluded.
- Full comparisons (source left, implementation right): `qa-option-3/compare-desktop.png`, `compare-mobile.png`.
- Focused comparisons: `qa-option-3/focused-header-hero.png`, `focused-mobile-reading.png`; evaluated logo, title weight, CTA, search and chapter hierarchy.
- State: homepage, navigation/search closed, v1.1 Review Draft. Actual 1440×1024 and 390×844 viewports additionally exercised, along with 320, 768 and 1024 widths.

## Findings and iteration history

1. Initial comparison used assumed 1440/390 capture widths for the smaller actual reference panels. Corrected to exact panel viewport dimensions before judging density.
2. P2 duplicate article outline/version labels: removed the duplicate presentation, preserved its source content, and used major Tokenomics sections for the reader outline. Verified in `tokenomics-final.png` and `tokenomics-execution-final.png`.
3. P2 unsupported search aria-expanded: removed the unsupported textbox attribute; retained labeled input, result links, result-count status and keyboard navigation. ESLint now has no warnings.
4. P2 narrow desktop/mobile spacing pushed revision scope too far down. Tightened header, hero and chapter spacing at those widths. Re-captured the matching states; all chapters remain readable and the revision section follows them without detached empty regions.
5. Final comparison: no remaining actionable P0/P1/P2 findings. Minor font-metric and text wrapping differences from a raster-generated mock remain P3.

## Required fidelity surfaces

- Typography: local Geist and Geist Mono, substantial black heading, restrained labels, readable article body. Weight and narrow-width line wrapping checked. No external font dependency.
- Layout: white content surface, neutral left directory, consistent column alignment, right section outline on desktop, compact responsive header and modal mobile directory. Chapter rows use dividers, revision notice uses a quiet neutral surface.
- Tokens: white/graphite/light grey with restrained red active indicators and links. Light styles are scoped; old archive keeps its original dark treatment.
- Assets: official MAGNE.AI raster wordmark, sharp at the rendered size; original monochrome mark retained instead of recoloring the official asset to match the mock's red slashes. Standard interface icons use existing Lucide thin-stroke icons. No fabricated illustration assets.
- Content: draft label, original v1.0 access, existing chapter scope and revision disclosure preserved. Revision disclosures is a precise label for the actual destination. Complete chapter directory and main/W3 links extend the mock to cover all existing routes. No new publication date, allocation change or production claim was introduced.

## Browser and build verification

- `qa-option-3/checks.json`: 142 desktop/mobile page checks; no HTTP errors, horizontal page overflow, broken images, missing new-site anchors or page errors.
- 33 v1.0 article hashes match the frozen source. v1.0 Tokenomics matches the original pre-revision file.
- Numeric invariants verified: 10bn supply, 76,250,500 outflows, 23,749,500 reserve, 700m MM reserve, 51.25m listing/services, 25m initial liquidity, 1,635,000 airdrop, 40m pool and block 124,568,474.
- `qa-option-3/interactions-final.json`: primary read flow, real clipboard contents, section navigation/scroll tracking, archive entry/internal navigation/return, keyboard search, mobile Escape/focus return, 18 checks across six widths, category redirects, old archive URL compatibility. Zero runtime errors.
- `npm run check`: lint, TypeScript and production build passed; 87 generated pages including redirect routes.

## Boundaries and follow-up polish

- Local frontend preview only; no production deployment. Existing chapter claims were carried over, not newly legally/technically certified. v1.1 remains Review Draft.
- Full-text search index and outlines refresh through `scripts/sync-whitepaper-content.mjs` after editing article HTML.
- Wallet interfaces retain the existing optional injected-provider behavior; no real wallet transaction or production integration was performed in this redesign.
- P3: subtle raster-reference font metrics, black official logo versus the mock's red mark, and natural paragraph wrapping can be further tuned.

## Implementation checklist

- [x] Whole current document set uses the chosen design.
- [x] Search, responsive directory and primary navigation work.
- [x] Complete original archive is isolated and linked.
- [x] Numeric invariants, accessibility interactions and responsive pages checked.
- [x] Reversible snapshot and editing instructions supplied.

## Traditional Chinese edition — 2026-09-30

- Added `/tc/` and all 36 current article/revision translations, retaining option 3's visual structure. EN / 繁體中文 is directly accessible in desktop and mobile headers and preserves chapter, query and section. English and Chinese layouts render `lang=en` and `lang=zh-Hant` respectively.
- Localized homepage, directory, outlines, search, pagination, copy feedback and wallet messages. Chinese text has CJK fallbacks and adjusted line spacing. Archived v1.0 remains original English and keeps its entry in both languages.
- `docs/localization-tc/qa/checks.json`: 148 English/Chinese desktop/mobile route checks and 24 further responsive checks at 320, 390, 768, 1024, 1154 and 1440 pixels. No page overflow, broken images, missing section anchors or runtime errors.
- Tested both switch directions with query and anchor, Chinese full-text keyboard search and empty state, primary reading flow, mobile menu navigation/Escape/focus, clipboard contents (normalizing Windows CRLF), Chinese no-wallet feedback, six localized category redirects and v1.0 entry.
- All 36 English source hashes and 33 frozen v1.0 hashes match their snapshots. Translated heading IDs, code, real equations, addresses and link destinations match. All numeric Tokenomics table data cells match the English edition; amounts, proportions and historical dates are unchanged. Three source fragments incorrectly formatted as KaTeX prose were translated into normal text; genuine equations remain intact.
- Visually reviewed Chinese homepage and Tokenomics at 1440 and 390, the developer guide at 1440, and header/reading layouts at 320 and 768. Screenshots are in `docs/localization-tc/qa/`.
- `npm run check` passed: ESLint, TypeScript and production build, 131 generated pages. No production deployment or GitHub push.
- Editing and recovery instructions updated in `WHITEPAPER-V1.1-EDITING.md`; pre-localization source snapshot preserved in `docs/localization-tc/before/src`.

## Official footer — 2026-09-30

- Inspected the current main-site footer and Cookie controls; source link inventory and screenshots saved under `docs/footer-reference/`. Reused its official GitHub, X, Telegram, YouTube and Discord destinations, matching-language Media Kit and Privacy Policy URLs, and current-year MAGNE.AI copyright.
- Added a shared English/Traditional Chinese footer to the v1.1 homepage and articles, using the approved light typography and separators. Reading links retain the selected language; the original v1.0 archive remains accessible.
- Cookie information is an actual native dialog with keyboard focus containment, Escape/close/Done controls and focus restoration. It accurately explains the whitepaper's existing language localStorage record and absence of analytics/advertising cookies. Clearing the record removes only `magne-whitepaper-language`; blocked storage shows an error instead of success. Main-site GA4 and consent machinery were not copied into this frontend.
- `docs/footer-reference/qa/checks.json`: 20 route/viewport checks across English/Chinese home and Tokenomics at 320, 390, 768, 1024 and 1440 pixels; 10 dialog/storage flows. Verified official destinations, privacy URLs, revision/archive navigation, zero page errors, no overflow, no analytics network calls or browser cookies. Visually reviewed desktop/mobile footer and 320px Chinese dialog screenshots.
- `npm run check` passed: lint, TypeScript and production build (131 pages). Local preview only.
