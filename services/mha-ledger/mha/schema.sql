PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS batches(
  id INTEGER PRIMARY KEY, start_block INTEGER NOT NULL, end_block INTEGER NOT NULL,
  end_hash TEXT NOT NULL, source TEXT NOT NULL, log_count INTEGER NOT NULL,
  observed_at TEXT NOT NULL, UNIQUE(start_block, end_block)
);
CREATE TABLE IF NOT EXISTS raw_logs(
  id INTEGER PRIMARY KEY, chain_id INTEGER NOT NULL, contract TEXT NOT NULL,
  block_number INTEGER NOT NULL, block_hash TEXT NOT NULL,
  tx_hash TEXT NOT NULL, tx_index INTEGER NOT NULL, log_index INTEGER NOT NULL,
  payload TEXT NOT NULL, observed_at TEXT NOT NULL, source TEXT NOT NULL,
  UNIQUE(chain_id, block_hash, log_index)
);
CREATE TRIGGER IF NOT EXISTS immutable_raw_update BEFORE UPDATE ON raw_logs
BEGIN SELECT RAISE(ABORT, 'raw logs are immutable'); END;
CREATE TRIGGER IF NOT EXISTS immutable_raw_delete BEFORE DELETE ON raw_logs
BEGIN SELECT RAISE(ABORT, 'raw logs are immutable'); END;
CREATE TABLE IF NOT EXISTS log_state(
  raw_id INTEGER PRIMARY KEY REFERENCES raw_logs(id),
  state TEXT NOT NULL CHECK(state IN ('pending','finalized','orphaned')),
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS state_history(
  id INTEGER PRIMARY KEY, raw_id INTEGER NOT NULL REFERENCES raw_logs(id),
  old_state TEXT, new_state TEXT NOT NULL, changed_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS transfers(
  raw_id INTEGER PRIMARY KEY REFERENCES raw_logs(id),
  batch_id INTEGER NOT NULL REFERENCES batches(id),
  chain_id INTEGER NOT NULL, tx_hash TEXT NOT NULL, log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL, block_time TEXT NOT NULL,
  from_address TEXT NOT NULL, to_address TEXT NOT NULL, value_raw TEXT NOT NULL,
  UNIQUE(chain_id, tx_hash, log_index)
);
CREATE TABLE IF NOT EXISTS balances(
  address TEXT PRIMARY KEY, balance_raw TEXT NOT NULL, inflow_raw TEXT NOT NULL,
  outflow_raw TEXT NOT NULL, event_count INTEGER NOT NULL,
  first_block INTEGER NOT NULL, last_block INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS reconciliations(
  id INTEGER PRIMARY KEY, block_number INTEGER NOT NULL, block_hash TEXT NOT NULL,
  mode TEXT NOT NULL, status TEXT NOT NULL, checked_at TEXT NOT NULL,
  report TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS labels(
  id INTEGER PRIMARY KEY, address TEXT NOT NULL, category TEXT NOT NULL,
  label TEXT NOT NULL, treatment TEXT NOT NULL, source TEXT NOT NULL,
  effective_block INTEGER NOT NULL, evidence_id INTEGER NOT NULL,
  UNIQUE(address, category, effective_block)
);
CREATE TABLE IF NOT EXISTS evidence(
  id INTEGER PRIMARY KEY, source TEXT NOT NULL, fetched_at TEXT NOT NULL, payload TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS alerts(
  id INTEGER PRIMARY KEY, severity TEXT NOT NULL, code TEXT NOT NULL,
  message TEXT NOT NULL, created_at TEXT NOT NULL, resolved_at TEXT
);
CREATE INDEX IF NOT EXISTS raw_block ON raw_logs(block_number);
CREATE INDEX IF NOT EXISTS transfer_from ON transfers(from_address, block_number);
CREATE INDEX IF NOT EXISTS transfer_to ON transfers(to_address, block_number);
CREATE INDEX IF NOT EXISTS label_address ON labels(address, effective_block);
-- Tail observations never mutate reconstructed historical balances.
CREATE TABLE IF NOT EXISTS live_batches(
  id INTEGER PRIMARY KEY, start_block INTEGER NOT NULL, end_block INTEGER NOT NULL,
  end_hash TEXT NOT NULL, source TEXT NOT NULL, log_count INTEGER NOT NULL,
  observed_at TEXT NOT NULL, UNIQUE(start_block, end_block)
);
CREATE TABLE IF NOT EXISTS live_transfers(
  raw_id INTEGER PRIMARY KEY REFERENCES raw_logs(id),
  batch_id INTEGER NOT NULL REFERENCES live_batches(id),
  tx_hash TEXT NOT NULL, log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL, block_time TEXT NOT NULL,
  from_address TEXT NOT NULL, to_address TEXT NOT NULL, value_raw TEXT NOT NULL,
  UNIQUE(tx_hash, log_index)
);
CREATE TABLE IF NOT EXISTS live_gaps(
  id INTEGER PRIMARY KEY, start_block INTEGER NOT NULL, end_block INTEGER NOT NULL,
  reason TEXT NOT NULL, recorded_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS live_transfer_block ON live_transfers(block_number, log_index);
-- Immutable expected balances at a fixed checkpoint; checked rows survive retries/restarts.
CREATE TABLE IF NOT EXISTS audit_jobs(
  id INTEGER PRIMARY KEY, block_number INTEGER NOT NULL, block_hash TEXT NOT NULL,
  started_at TEXT NOT NULL, finished_at TEXT, status TEXT NOT NULL,
  supply_raw TEXT NOT NULL, ledger_sum_raw TEXT NOT NULL, addresses_known INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_balances(
  job_id INTEGER NOT NULL REFERENCES audit_jobs(id), address TEXT NOT NULL,
  balance_raw TEXT NOT NULL, onchain_raw TEXT,
  PRIMARY KEY(job_id,address)
);
CREATE INDEX IF NOT EXISTS audit_pending ON audit_balances(job_id,address) WHERE onchain_raw IS NULL;
