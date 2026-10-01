# MAGNE.AI Whitepaper

Independent repository for the MAGNE.AI whitepaper v1.1 review site, separate from the main MAGNE website, the W3 portal and the earlier web3 website.

## Site scope

- English: `/`; Traditional Chinese: `/tc`.
- 36 document chapters per language, numbered navigation and full-text search.
- Preserved original English v1.0 at `/v1.0`.
- MHA allocation and reserve disclosures, GEN1 base and optional-incentive calculators.
- Local images/fonts, responsive layouts and source-only developer example downloads.

This is a **review draft**. Proposed rules, governance and mainnet services are not made effective by publishing this repository. See the [revision record](docs/full-text-revision-20261002/changes.html).

## Run

Requires Node.js 24+. No secrets or environment file are required for this documentation site.

```sh
npm ci
npm run dev -- --hostname 127.0.0.1 --port 4173
```

Production-mode local preview:

```sh
npm run build
npm run start -- --hostname 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173/tc` or the English root. Builds automatically refresh titles, outlines and search using a static HTML parser; no browser is needed to build. Standalone Next.js output is enabled. GitHub upload does not deploy the website or change DNS. Search indexing remains disabled for this review preview.

## Edit

| Area | Location |
| --- | --- |
| English v1.1 | `src/content/whitepaper/` |
| Traditional Chinese v1.1 | `src/content/whitepaper-tc/` |
| Preserved original | `src/content/archive-v1/` |
| UI, figures and calculators | `src/components/whitepaper/` |
| Styles | `src/app/whitepaper.css`, `src/app/whitepaper-figures.css`, `src/app/tokenomics-reader.css` |
| Assets and example downloads | `public/` |

Edit both languages and retain matching anchor IDs. Run `npm run content:sync` if not building immediately. Historical extraction, translation and migration scripts can overwrite newer content; do not rerun them as a normal build step.

See [the editing guide](WHITEPAPER-V1.1-EDITING.md). Local backup snapshots, screenshots, dependencies and runtime logs are excluded from Git. Some historical reports refer to these local-only artifacts.

## Validate

```sh
npm run lint
npm run build
npm run test:models
```

The build includes TypeScript checks. GitHub Actions checks code, builds and tests GEN1 models; it does not deploy or submit transactions. Browser QA scripts use Playwright with locally installed Edge. The full-text review checked 72 document pages at desktop/mobile widths. Contract and web examples were tested with local Anvil, not public-chain broadcasts.

## Editorial controls

Keep the 10 billion MHA total, ten allocation percentages, 13,750 GEN1 reference count and calculator logic consistent. Preserve dates on historical balance snapshots. Distinguish allocations, reserve releases, approvals, transfers and claims.

Pending confirmations include L1 consensus, the mBGT/MHA voting relationship, conflicting historical public-sale vesting descriptions, the precise follow-on delivery window and some certificate dates. Draft prose does not establish implementation or contractual effectiveness.

## Attribution

Originally based on [JCodesMore/ai-website-cloner-template](https://github.com/JCodesMore/ai-website-cloner-template). Its MIT notice remains in [LICENSE](LICENSE), and upstream template history is retained.
