# MHA cloud service source

This is the existing project-maintained Python MHA ledger, imported on 2026-10-21.
It reads BSC directly and has no dependency on an office host or its HTTP service.
No database, RPC credential, private key, `.env`, or backup is included.

`source-manifest.json` records the original source hashes before integration edits.
The imported files match the existing HW-03 service except the pre-existing Windows
`fcntl` compatibility shim. Integration changes use relative asset/API URLs so the
same UI works at `/mha/`, and add a return link to the whitepaper. The accounting,
finality, provider cooldown, replay, schema, and reconciliation logic are unchanged.

The ledger UI is the existing Simplified Chinese dashboard. The whitepaper remains
English/Traditional Chinese. Dashboard translation and purpose/approval editing are
separate from the cloud deployment package; no approval is inferred from a transfer.

Read [cloud deployment instructions](../../deploy/cloud/README.md) before starting.

Run the existing tests from this directory:

```sh
python3 -m unittest discover -s tests -q
node tests/test_web_logic.cjs
```
