"""Clean messy legacy CSVs into UTF-8 staging files ready for SQLite."""

from __future__ import annotations

import csv
import re
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path

import pandas as pd
from dateutil import parser as date_parser

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"
STAGING_DIR = ROOT / "data" / "staging"
CONFIG_DIR = ROOT / "config"

AMOUNT_RE = re.compile(r"[^0-9.\-]")
CANONICAL_ALIASES = {
    "aws": "Amazon Web Services",
    "aws inc.": "Amazon Web Services",
    "aws inc": "Amazon Web Services",
    "amazon web services": "Amazon Web Services",
    "gcp": "Google Cloud",
    "google cloud": "Google Cloud",
    "google cloud platform": "Google Cloud",
    "msft azure": "Microsoft Azure",
    "microsoft azure": "Microsoft Azure",
    "azure": "Microsoft Azure",
    "slack": "Slack Technologies",
    "slack technologies": "Slack Technologies",
}


def parse_amount(value) -> float | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return 0.0
    text = str(value).strip()
    if text == "" or text.lower() in {"nan", "none"}:
        return 0.0
    cleaned = AMOUNT_RE.sub("", text.replace(",", ""))
    if cleaned in {"", "-", ".", "-."}:
        return None
    try:
        return round(float(cleaned), 2)
    except ValueError:
        return None


def parse_date(value) -> str | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        return date_parser.parse(text, dayfirst=False).date().isoformat()
    except (ValueError, OverflowError, TypeError):
        return None


def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()


def canonical_vendor_name(name: str) -> str:
    key = re.sub(r"[^a-z0-9 ]+", "", name.lower()).strip()
    if key in CANONICAL_ALIASES:
        return CANONICAL_ALIASES[key]
    return name.strip()


def cluster_vendors(vendors: pd.DataFrame) -> pd.DataFrame:
    vendors = vendors.copy()
    vendors["vendor_name"] = vendors["vendor_name"].astype(str).str.strip()
    vendors["canonical_name"] = vendors["vendor_name"].map(canonical_vendor_name)

    names = vendors["canonical_name"].unique().tolist()
    parent = {n: n for n in names}

    def find(x: str) -> str:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for i, left in enumerate(names):
        for right in names[i + 1 :]:
            if similarity(left, right) >= 0.82:
                parent[find(right)] = find(left)

    vendors["canonical_name"] = vendors["canonical_name"].map(find)

    golden = {}
    for canon, group in vendors.groupby("canonical_name"):
        # Prefer the longest, most formal name as the golden record.
        golden[canon] = max(group["vendor_name"].tolist(), key=len)
    vendors["canonical_name"] = vendors["canonical_name"].map(golden)

    keep_id = (
        vendors.sort_values(["canonical_name", "vendor_id"])
        .groupby("canonical_name", as_index=False)
        .first()[["canonical_name", "vendor_id"]]
        .rename(columns={"vendor_id": "merged_into_id"})
    )
    vendors = vendors.merge(keep_id, on="canonical_name", how="left")
    vendors["is_duplicate"] = (vendors["vendor_id"] != vendors["merged_into_id"]).astype(int)
    vendors.loc[vendors["is_duplicate"] == 0, "merged_into_id"] = ""
    return vendors


def load_mapping() -> pd.DataFrame:
    mapping = pd.read_csv(CONFIG_DIR / "gl_mapping.csv", dtype=str).fillna("")
    mapping["legacy_key"] = mapping["legacy_category"].str.strip().str.lower()
    return mapping


def transform() -> dict:
    STAGING_DIR.mkdir(parents=True, exist_ok=True)

    coa = pd.read_csv(RAW_DIR / "chart_of_accounts.csv", dtype=str).fillna("")
    vendors_raw = pd.read_csv(RAW_DIR / "legacy_vendors.csv", dtype=str).fillna("")
    txns = pd.read_csv(RAW_DIR / "legacy_transactions.csv", dtype=str).fillna("")
    mapping = load_mapping()

    vendors = cluster_vendors(vendors_raw)

    def _is_filled(value) -> bool:
        if value is None or (isinstance(value, float) and pd.isna(value)):
            return False
        return str(value).strip() not in {"", "nan", "None"}

    vendor_remap = {}
    for row in vendors.itertuples(index=False):
        if int(row.is_duplicate) == 1 and _is_filled(row.merged_into_id):
            vendor_remap[str(row.vendor_id)] = str(row.merged_into_id).strip()
        else:
            vendor_remap[str(row.vendor_id)] = str(row.vendor_id).strip()

    txns["source_row"] = range(2, len(txns) + 2)
    txns["legacy_vendor_id"] = txns["vendor_id"].astype(str).str.strip().replace({"nan": ""})
    txns["vendor_id"] = txns["legacy_vendor_id"].map(
        lambda v: vendor_remap.get(v, v) if v else ""
    )
    txns["vendor_id"] = txns["vendor_id"].fillna("").astype(str).replace({"nan": "", "None": ""})
    txns["txn_date_raw"] = txns["txn_date"]
    txns["txn_date"] = txns["txn_date"].map(parse_date)
    txns["debit_amount_raw"] = txns["debit_amount"]
    txns["credit_amount_raw"] = txns["credit_amount"]
    txns["debit_amount"] = txns["debit_amount"].map(parse_amount)
    txns["credit_amount"] = txns["credit_amount"].map(parse_amount)
    txns["currency"] = txns["currency"].str.strip().str.upper().replace({"": "USD"})
    txns["legacy_category"] = txns["legacy_category"].str.strip()
    txns["legacy_key"] = txns["legacy_category"].str.lower()

    mapped = mapping.drop_duplicates("legacy_key")
    txns = txns.merge(
        mapped[["legacy_key", "target_gl_code", "target_account_name"]],
        on="legacy_key",
        how="left",
    )
    # Prefer mapping table; fall back to source gl_code if it exists on COA.
    valid_codes = set(coa["gl_code"])
    txns["gl_code_source"] = txns["gl_code"].str.strip()
    txns["gl_code"] = txns["target_gl_code"].where(
        txns["target_gl_code"].notna() & (txns["target_gl_code"] != ""),
        txns["gl_code_source"],
    )
    txns["gl_code"] = txns["gl_code"].astype(str).str.replace(r"\.0$", "", regex=True)
    txns.loc[txns["gl_code"].isin({"", "nan", "None", "ERROR: UNMAPPED"}), "gl_code"] = pd.NA
    txns["gl_code"] = txns["gl_code"].where(txns["gl_code"].isin(valid_codes), pd.NA)

    issues = []

    def flag(mask, issue, severity):
        subset = txns.loc[mask, ["txn_id", "journal_batch_id", "vendor_id", "legacy_category", "gl_code"]]
        for row in subset.itertuples(index=True):
            issues.append(
                {
                    "txn_id": row.txn_id,
                    "journal_batch_id": row.journal_batch_id,
                    "issue_type": issue,
                    "severity": severity,
                    "vendor_id": row.vendor_id,
                    "legacy_category": row.legacy_category,
                    "gl_code": row.gl_code or "",
                    "detail": issue,
                }
            )

    flag(txns["txn_date"].isna(), "INVALID_DATE", "HIGH")
    flag(txns["debit_amount"].isna() | txns["credit_amount"].isna(), "INVALID_AMOUNT", "HIGH")
    txns["debit_amount"] = txns["debit_amount"].fillna(0.0)
    txns["credit_amount"] = txns["credit_amount"].fillna(0.0)

    known_vendors = set(vendors["vendor_id"]) | set(vendors["merged_into_id"].dropna())
    known_vendors |= set(vendors.loc[vendors["is_duplicate"] == 0, "vendor_id"])
    # After remap, valid IDs are golden vendor_ids only.
    golden_ids = set(vendors.loc[vendors["is_duplicate"] == 0, "vendor_id"])
    orphan_mask = (txns["vendor_id"] != "") & (~txns["vendor_id"].isin(golden_ids))
    flag(orphan_mask, "ORPHAN_VENDOR", "HIGH")

    unmapped_mask = txns["gl_code"].isna() | (txns["gl_code"] == "")
    flag(unmapped_mask, "UNMAPPED_GL", "HIGH")

    batch_var = (
        txns.groupby("journal_batch_id", as_index=False)
        .agg(debits=("debit_amount", "sum"), credits=("credit_amount", "sum"))
    )
    batch_var["variance"] = (batch_var["debits"] - batch_var["credits"]).round(2)
    unbalanced_batches = set(batch_var.loc[batch_var["variance"] != 0, "journal_batch_id"])
    flag(txns["journal_batch_id"].isin(unbalanced_batches), "UNBALANCED_JOURNAL", "HIGH")

    issue_df = pd.DataFrame(issues)
    bad_batches = set(issue_df["journal_batch_id"]) if not issue_df.empty else set()
    # Hold the entire journal, not just the broken line, so ERP-ready stays in balance.
    txns["validation_status"] = txns["journal_batch_id"].map(
        lambda b: "QUARANTINE" if b in bad_batches else "ERP_READY"
    )

    staging_vendors = vendors[
        ["vendor_id", "vendor_name", "canonical_name", "payment_terms", "status", "is_duplicate", "merged_into_id"]
    ]
    staging_txns = txns[
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
            "validation_status",
            "legacy_vendor_id",
        ]
    ]

    coa.to_csv(STAGING_DIR / "clean_chart_of_accounts.csv", index=False, encoding="utf-8")
    staging_vendors.to_csv(STAGING_DIR / "clean_vendors.csv", index=False, encoding="utf-8")
    staging_txns.to_csv(STAGING_DIR / "clean_transactions.csv", index=False, encoding="utf-8")
    issue_df.to_csv(STAGING_DIR / "quarantine_exceptions.csv", index=False, encoding="utf-8")
    batch_var.to_csv(STAGING_DIR / "journal_batch_balance.csv", index=False, encoding="utf-8")

    summary = {
        "raw_txn_count": int(len(txns)),
        "erp_ready_count": int((txns["validation_status"] == "ERP_READY").sum()),
        "quarantine_count": int((txns["validation_status"] == "QUARANTINE").sum()),
        "orphan_vendor_txns": int(orphan_mask.sum()),
        "unmapped_gl_txns": int(unmapped_mask.sum()),
        "unbalanced_batches": int(len(unbalanced_batches)),
        "duplicate_vendors_merged": int(vendors["is_duplicate"].sum()),
        "source_debits": float(txns["debit_amount"].sum()),
        "source_credits": float(txns["credit_amount"].sum()),
        "ready_debits": float(txns.loc[txns["validation_status"] == "ERP_READY", "debit_amount"].sum()),
        "ready_credits": float(txns.loc[txns["validation_status"] == "ERP_READY", "credit_amount"].sum()),
        "quarantine_debits": float(txns.loc[txns["validation_status"] == "QUARANTINE", "debit_amount"].sum()),
        "quarantine_credits": float(txns.loc[txns["validation_status"] == "QUARANTINE", "credit_amount"].sum()),
    }
    pd.DataFrame([summary]).to_csv(STAGING_DIR / "transform_summary.csv", index=False, encoding="utf-8")
    print("Transform complete:")
    for key, value in summary.items():
        print(f"  {key}: {value}")
    return summary


if __name__ == "__main__":
    transform()
