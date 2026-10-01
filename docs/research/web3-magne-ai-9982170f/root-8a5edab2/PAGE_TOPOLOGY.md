# Page topology

Header, Hero, CommunityStats, Adoption, Growth, CommunityHeading, CommunityGallery, JoinCommunity, TokenEconomics, Footer.

The eight content components are inside the main landmark. Backgrounds remain positioned source layers; header/footer remain document-flow elements. Gallery is the only time-driven content section. Header is click-driven on small screens. All other content is static except link hover/focus states.

Exact DOM, source classes and observed heading measurements are in the ten `components/*.spec.md` files; full computed extraction at 1440, 768 and 390px is in `docs/research/web3/source-{width}.json`.
