# Contract examples

Node.js 24. Bash/WSL commands are used in the chapter.

Install in Bash/WSL with npm ci. For native Windows, upstream Foundry npm install scripts use POSIX syntax. Use:

    npm ci --ignore-scripts
    node node_modules/@foundry-rs/forge/postinstall.mjs forge
    node node_modules/@foundry-rs/cast/postinstall.mjs cast
    node node_modules/@foundry-rs/anvil/postinstall.mjs anvil
    npm test

Only the localhost Anvil deployment uses an unlocked account. For testnets, use a dedicated encrypted keystore. No private keys are distributed.

Solidity 0.8.30 and Paris are pinned example build settings, not a declaration of the current testnet fork.
