-- Staging schema for the target cloud ERP import.
-- Load order: chart_of_accounts -> vendors -> gl_transactions

CREATE TABLE IF NOT EXISTS chart_of_accounts (
    gl_code       TEXT PRIMARY KEY,
    account_name  TEXT NOT NULL,
    account_type  TEXT NOT NULL CHECK (account_type IN ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')),
    is_active     INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS vendors (
    vendor_id        TEXT PRIMARY KEY,
    vendor_name      TEXT NOT NULL,
    canonical_name   TEXT,
    payment_terms    TEXT,
    status           TEXT,
    is_duplicate     INTEGER NOT NULL DEFAULT 0,
    merged_into_id   TEXT,
    FOREIGN KEY (merged_into_id) REFERENCES vendors(vendor_id)
);

CREATE TABLE IF NOT EXISTS gl_transactions (
    txn_id            TEXT PRIMARY KEY,
    journal_batch_id  TEXT NOT NULL,
    txn_date          TEXT NOT NULL,          -- ISO YYYY-MM-DD after transform
    txn_type          TEXT,                   -- AP_INVOICE | AR_PAYMENT | JOURNAL
    vendor_id         TEXT,
    legacy_category   TEXT,
    gl_code           TEXT,
    debit_amount      REAL NOT NULL DEFAULT 0,
    credit_amount     REAL NOT NULL DEFAULT 0,
    currency          TEXT NOT NULL DEFAULT 'USD',
    source_row        INTEGER,
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id),
    FOREIGN KEY (gl_code) REFERENCES chart_of_accounts(gl_code)
);

CREATE INDEX IF NOT EXISTS idx_gl_vendor ON gl_transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_gl_code ON gl_transactions(gl_code);
CREATE INDEX IF NOT EXISTS idx_gl_batch ON gl_transactions(journal_batch_id);
CREATE INDEX IF NOT EXISTS idx_gl_date ON gl_transactions(txn_date);
