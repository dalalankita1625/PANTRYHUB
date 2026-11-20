"""Load staging CSVs into SQLite and run pre-migration validation queries."""

from __future__ import annotations

import sqlite3
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
STAGING_DIR = ROOT / "data" / "staging"
REPORTS_DIR = ROOT / "data" / "reports"
DB_PATH = ROOT / "data" / "erp_staging.sqlite"
SCHEMA_PATH = ROOT / "sql" / "schema.sql"


QUERIES = {
    "orphan_vendors": """
        SELECT t.txn_id, t.journal_batch_id, t.vendor_id, t.legacy_category,
               t.debit_amount, t.credit_amount
        FROM gl_transactions t
        LEFT JOIN vendors v ON t.vendor_id = v.vendor_id
        WHERE t.vendor_id IS NOT NULL AND t.vendor_id <> '' AND v.vendor_id IS NULL
    """,
    "trial_balance": """
        SELECT
            ROUND(SUM(debit_amount), 2) AS total_debits,
            ROUND(SUM(credit_amount), 2) AS total_credits,
            ROUND(SUM(debit_amount) - SUM(credit_amount), 2) AS variance
        FROM gl_transactions
    """,
    "unbalanced_batches": """
        SELECT
            journal_batch_id,
            COUNT(*) AS line_count,
            ROUND(SUM(debit_amount), 2) AS batch_debits,
            ROUND(SUM(credit_amount), 2) AS batch_credits,
            ROUND(SUM(debit_amount) - SUM(credit_amount), 2) AS variance
        FROM gl_transactions
        GROUP BY journal_batch_id
        HAVING ROUND(SUM(debit_amount) - SUM(credit_amount), 2) <> 0
        ORDER BY journal_batch_id
    """,
    "unmapped_gl": """
        SELECT txn_id, journal_batch_id, legacy_category, gl_code, debit_amount, credit_amount
        FROM gl_transactions
        WHERE gl_code IS NULL OR gl_code = ''
           OR gl_code NOT IN (SELECT gl_code FROM chart_of_accounts)
    """,
    "ap_aging": """
        WITH as_of AS (SELECT DATE('2024-12-31') AS as_of_date)
        SELECT
            CASE
                WHEN CAST(julianday((SELECT as_of_date FROM as_of)) - julianday(t.txn_date) AS INTEGER) <= 30 THEN '0-30'
                WHEN CAST(julianday((SELECT as_of_date FROM as_of)) - julianday(t.txn_date) AS INTEGER) <= 60 THEN '31-60'
                WHEN CAST(julianday((SELECT as_of_date FROM as_of)) - julianday(t.txn_date) AS INTEGER) <= 90 THEN '61-90'
                ELSE '90+'
            END AS aging_bucket,
            COUNT(*) AS invoice_count,
            ROUND(SUM(t.credit_amount), 2) AS ap_balance
        FROM gl_transactions t
        WHERE t.txn_type = 'AP_INVOICE' AND t.gl_code = '2000'
        GROUP BY aging_bucket
        ORDER BY CASE aging_bucket
            WHEN '0-30' THEN 1 WHEN '31-60' THEN 2 WHEN '61-90' THEN 3 ELSE 4 END
    """,
    "duplicate_vendor_clusters": """
        SELECT canonical_name,
               COUNT(*) AS name_variants,
               GROUP_CONCAT(vendor_name, ' | ') AS variants
        FROM vendors
        GROUP BY canonical_name
        HAVING COUNT(*) > 1
        ORDER BY name_variants DESC
    """,
    "erp_ready_export": """
        SELECT txn_id, journal_batch_id, txn_date, txn_type, vendor_id,
               legacy_category, gl_code, debit_amount, credit_amount, currency
        FROM gl_transactions
        WHERE journal_batch_id NOT IN (
            SELECT t.journal_batch_id
            FROM gl_transactions t
            LEFT JOIN vendors v ON t.vendor_id = v.vendor_id
            LEFT JOIN chart_of_accounts c ON t.gl_code = c.gl_code
            WHERE (t.vendor_id IS NOT NULL AND t.vendor_id <> '' AND v.vendor_id IS NULL)
               OR t.gl_code IS NULL OR t.gl_code = '' OR c.gl_code IS NULL
            UNION
            SELECT journal_batch_id FROM gl_transactions
            GROUP BY journal_batch_id
            HAVING ROUND(SUM(debit_amount) - SUM(credit_amount), 2) <> 0
        )
        ORDER BY txn_date, txn_id
    """,
}


def load() -> sqlite3.Connection:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    if DB_PATH.exists():
        DB_PATH.unlink()

    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))

    coa = pd.read_csv(STAGING_DIR / "clean_chart_of_accounts.csv", dtype=str).fillna("")
    vendors = pd.read_csv(STAGING_DIR / "clean_vendors.csv", dtype=str).fillna("")
    txns = pd.read_csv(STAGING_DIR / "clean_transactions.csv")

    # SQLite FK: only golden (non-duplicate) vendors should be the live master.
    vendors_load = vendors[
        ["vendor_id", "vendor_name", "canonical_name", "payment_terms", "status", "is_duplicate", "merged_into_id"]
    ].copy()
    vendors_load["merged_into_id"] = vendors_load["merged_into_id"].replace("", None)
    vendors_load["is_duplicate"] = vendors_load["is_duplicate"].astype(int)

    coa_load = coa.rename(columns={"status": "is_active"})
    coa_load["is_active"] = 1
    coa_load["gl_code"] = coa_load["gl_code"].astype(str).str.replace(r"\.0$", "", regex=True)
    coa_load[["gl_code", "account_name", "account_type", "is_active"]].to_sql(
        "chart_of_accounts", conn, if_exists="append", index=False
    )
    vendors_load.to_sql("vendors", conn, if_exists="append", index=False)

    txn_load = txns[
        [
            "txn_id",
            "journal_batch_id",
            "txn_date",
            "txn_type",
            "vendor_id",
            "legacy_category",
            "gl_code",
            "debit_amount",
            "credit_amount",
            "currency",
            "source_row",
        ]
    ].copy()
    def as_code(value):
        if pd.isna(value):
            return None
        text = str(value).strip()
        if text in {"", "nan", "None"}:
            return None
        if text.endswith(".0"):
            text = text[:-2]
        return text

    txn_load["vendor_id"] = txn_load["vendor_id"].map(as_code)
    txn_load["gl_code"] = txn_load["gl_code"].map(as_code)
    txn_load.to_sql("gl_transactions", conn, if_exists="append", index=False)
    conn.commit()
    return conn


def validate(conn: sqlite3.Connection) -> dict[str, pd.DataFrame]:
    results = {}
    for name, sql in QUERIES.items():
        df = pd.read_sql_query(sql, conn)
        results[name] = df
        out = REPORTS_DIR / f"{name}.csv"
        df.to_csv(out, index=False, encoding="utf-8")
        print(f"{name}: {len(df)} row(s) -> {out}")
    return results


def main() -> dict[str, pd.DataFrame]:
    conn = load()
    try:
        results = validate(conn)
    finally:
        conn.close()
    return results


if __name__ == "__main__":
    main()
