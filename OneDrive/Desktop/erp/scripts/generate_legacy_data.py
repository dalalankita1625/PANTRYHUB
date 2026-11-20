"""Generate deliberately messy legacy ERP extracts for a B2B SaaS company."""

from __future__ import annotations

import csv
import random
from datetime import date, timedelta
from pathlib import Path

SEED = 42
RAW_DIR = Path(__file__).resolve().parents[1] / "data" / "raw"

CHART_OF_ACCOUNTS = [
    ("1000", "Cash", "Asset"),
    ("1200", "Accounts Receivable", "Asset"),
    ("1500", "Prepaid Expenses", "Asset"),
    ("2000", "Accounts Payable", "Liability"),
    ("2100", "Accrued Expenses", "Liability"),
    ("3000", "Common Stock", "Equity"),
    ("4000", "Subscription Revenue", "Revenue"),
    ("4100", "Professional Services Revenue", "Revenue"),
    ("5000", "Cost of Goods Sold", "Expense"),
    ("6100", "Infrastructure Expense", "Expense"),
    ("6200", "Software Licenses", "Expense"),
    ("6300", "Office Supplies", "Expense"),
    ("6400", "Professional Fees", "Expense"),
    ("6500", "Marketing Expense", "Expense"),
    ("6600", "Travel & Entertainment", "Expense"),
    ("6700", "Payroll Expense", "Expense"),
    ("6800", "Bank Fees", "Expense"),
]

# 30 vendor master rows, including 4 duplicate-name clusters.
VENDORS = [
    ("V001", "Amazon Web Services", "Net 30", "Active"),
    ("V002", "AWS", "Net 30", "Active"),  # duplicate of AWS cluster
    ("V003", "AWS Inc.", "Net 15", "Active"),  # duplicate of AWS cluster
    ("V004", "Google Cloud", "Net 30", "Active"),
    ("V005", "GCP", "Net 30", "Inactive"),  # duplicate of Google
    ("V006", "Microsoft Azure", "Net 45", "Active"),
    ("V007", "MSFT Azure", "Net 45", "Active"),  # duplicate of Azure
    ("V008", "Slack Technologies", "Due on Receipt", "Active"),
    ("V009", "Slack", "Net 15", "Active"),  # duplicate of Slack
    ("V010", "Salesforce", "Net 30", "Active"),
    ("V011", "HubSpot", "Net 30", "Active"),
    ("V012", "Stripe", "Net 15", "Active"),
    ("V013", "Deloitte LLP", "Net 30", "Active"),
    ("V014", "PwC", "Net 30", "Active"),
    ("V015", "WeWork", "Net 30", "Inactive"),
    ("V016", "Staples", "Net 15", "Active"),
    ("V017", "Delta Airlines", "Due on Receipt", "Active"),
    ("V018", "LinkedIn Ads", "Net 30", "Active"),
    ("V019", "Meta Ads", "Net 30", "Active"),
    ("V020", "GitHub", "Net 30", "Active"),
    ("V021", "Datadog", "Net 30", "Active"),
    ("V022", "Okta", "Net 30", "Active"),
    ("V023", "Zoom Video", "Net 15", "Active"),
    ("V024", "Adobe", "Net 30", "Active"),
    ("V025", "Gusto Payroll", "Net 15", "Active"),
    ("V026", "Rippling", "Net 15", "Active"),
    ("V027", "USPS", "Due on Receipt", "Active"),
    ("V028", "FedEx", "Net 15", "Active"),
    ("V029", "Acme Office Co", "Net 30", "Active"),
    ("V030", "Northstar Legal", "Net 45", "Active"),
]

EXPENSE_CATEGORIES = [
    ("Cloud Hosting", "6100", ["V001", "V002", "V003", "V004", "V005", "V006", "V007", "V021"]),
    ("Software Licenses", "6200", ["V008", "V009", "V010", "V011", "V020", "V022", "V023", "V024"]),
    ("Office Supplies", "6300", ["V016", "V027", "V028", "V029"]),
    ("Professional Fees", "6400", ["V013", "V014", "V030"]),
    ("Marketing", "6500", ["V018", "V019", "V011"]),
    ("Travel", "6600", ["V017"]),
    ("Payroll", "6700", ["V025", "V026"]),
    ("Bank Fees", "6800", ["V012"]),
]

UNMAPPED_CATEGORIES = ["Misc Expense", "Unknown Category", ""]


def _write_csv(path: Path, fieldnames: list[str], rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def _messy_date(d: date, rng: random.Random) -> str:
    style = rng.choice(["iso", "us", "us", "iso", "slash_full"])
    if style == "iso":
        return d.strftime("%Y-%m-%d")
    if style == "us":
        return d.strftime("%m/%d/%Y")
    return d.strftime("%m/%d/%y")


def _messy_amount(value: float, rng: random.Random, dirty: bool) -> str:
    if not dirty:
        return f"{value:.2f}"
    style = rng.choice(["dollar", "usd_suffix", "comma"])
    if style == "dollar":
        return f"${value:,.2f}"
    if style == "usd_suffix":
        return f"${value:,.2f} USD"
    return f"{value:,.2f}"


def generate() -> None:
    rng = random.Random(SEED)
    start = date(2024, 1, 5)
    end = date(2024, 12, 20)

    _write_csv(
        RAW_DIR / "chart_of_accounts.csv",
        ["gl_code", "account_name", "account_type", "status"],
        [
            {
                "gl_code": code,
                "account_name": name,
                "account_type": acct_type,
                "status": "Active",
            }
            for code, name, acct_type in CHART_OF_ACCOUNTS
        ],
    )

    _write_csv(
        RAW_DIR / "legacy_vendors.csv",
        ["vendor_id", "vendor_name", "payment_terms", "status"],
        [
            {
                "vendor_id": vid,
                "vendor_name": name,
                "payment_terms": terms,
                "status": status,
            }
            for vid, name, terms, status in VENDORS
        ],
    )

    valid_vendor_ids = [v[0] for v in VENDORS]
    rows: list[dict] = []
    txn_n = 1
    batch_n = 1
    dirty_amount_budget = 15
    orphan_budget = 5
    unmapped_budget = 8

    def next_txn() -> str:
        nonlocal txn_n
        txn_id = f"TXN-{txn_n:04d}"
        txn_n += 1
        return txn_id

    def next_batch() -> str:
        nonlocal batch_n
        batch_id = f"JE-{batch_n:04d}"
        batch_n += 1
        return batch_id

    def random_day() -> date:
        span = (end - start).days
        return start + timedelta(days=rng.randint(0, span))

    def add_row(
        *,
        batch_id: str,
        txn_date: date,
        txn_type: str,
        vendor_id: str | None,
        category: str,
        gl_code: str,
        debit: float,
        credit: float,
        force_dirty: bool = False,
    ) -> None:
        nonlocal dirty_amount_budget
        dirty = force_dirty or (dirty_amount_budget > 0 and rng.random() < 0.04)
        if dirty and dirty_amount_budget > 0:
            dirty_amount_budget -= 1
        else:
            dirty = False
        rows.append(
            {
                "txn_id": next_txn(),
                "journal_batch_id": batch_id,
                "txn_date": _messy_date(txn_date, rng),
                "txn_type": txn_type,
                "vendor_id": vendor_id or "",
                "legacy_category": category,
                "gl_code": gl_code,
                "debit_amount": _messy_amount(debit, rng, dirty and debit > 0),
                "credit_amount": _messy_amount(credit, rng, dirty and credit > 0 and debit == 0),
                "currency": rng.choice(["USD", "USD", "usd", "USD "]),
            }
        )

    # Balanced AP invoices: debit expense / credit AP
    for _ in range(280):
        category, gl_code, vendor_pool = rng.choice(EXPENSE_CATEGORIES)
        vendor_id = rng.choice(vendor_pool)
        amount = round(rng.uniform(120, 18500), 2)
        txn_date = random_day()
        batch_id = next_batch()
        add_row(
            batch_id=batch_id,
            txn_date=txn_date,
            txn_type="AP_INVOICE",
            vendor_id=vendor_id,
            category=category,
            gl_code=gl_code,
            debit=amount,
            credit=0,
        )
        add_row(
            batch_id=batch_id,
            txn_date=txn_date,
            txn_type="AP_INVOICE",
            vendor_id=vendor_id,
            category="Accounts Payable",
            gl_code="2000",
            debit=0,
            credit=amount,
        )

    # Balanced AR customer payments: debit cash / credit AR
    for _ in range(70):
        amount = round(rng.uniform(500, 42000), 2)
        txn_date = random_day()
        batch_id = next_batch()
        add_row(
            batch_id=batch_id,
            txn_date=txn_date,
            txn_type="AR_PAYMENT",
            vendor_id="",
            category="Customer Payment",
            gl_code="1000",
            debit=amount,
            credit=0,
        )
        add_row(
            batch_id=batch_id,
            txn_date=txn_date,
            txn_type="AR_PAYMENT",
            vendor_id="",
            category="Accounts Receivable",
            gl_code="1200",
            debit=0,
            credit=amount,
        )

    # Balanced journals (accruals)
    for _ in range(12):
        amount = round(rng.uniform(800, 6000), 2)
        txn_date = random_day()
        batch_id = next_batch()
        add_row(
            batch_id=batch_id,
            txn_date=txn_date,
            txn_type="JOURNAL",
            vendor_id=rng.choice(["V013", "V014", "V030"]),
            category="Professional Fees",
            gl_code="6400",
            debit=amount,
            credit=0,
        )
        add_row(
            batch_id=batch_id,
            txn_date=txn_date,
            txn_type="JOURNAL",
            vendor_id="",
            category="Accounts Payable",
            gl_code="2100",
            debit=0,
            credit=amount,
        )

    # 5 orphan vendor invoices (valid amounts, invalid vendor_id)
    orphan_ids = ["V997", "V998", "V999", "VX01", "V-GONE"]
    for orphan_id in orphan_ids[:orphan_budget]:
        amount = round(rng.uniform(250, 3200), 2)
        txn_date = random_day()
        batch_id = next_batch()
        add_row(
            batch_id=batch_id,
            txn_date=txn_date,
            txn_type="AP_INVOICE",
            vendor_id=orphan_id,
            category="Cloud Hosting",
            gl_code="6100",
            debit=amount,
            credit=0,
        )
        add_row(
            batch_id=batch_id,
            txn_date=txn_date,
            txn_type="AP_INVOICE",
            vendor_id=orphan_id,
            category="Accounts Payable",
            gl_code="2000",
            debit=0,
            credit=amount,
        )

    # 8 unmapped category rows, still balanced against AP
    for _ in range(unmapped_budget):
        amount = round(rng.uniform(90, 1400), 2)
        txn_date = random_day()
        batch_id = next_batch()
        category = rng.choice(UNMAPPED_CATEGORIES)
        vendor_id = rng.choice(valid_vendor_ids)
        add_row(
            batch_id=batch_id,
            txn_date=txn_date,
            txn_type="AP_INVOICE",
            vendor_id=vendor_id,
            category=category,
            gl_code="",
            debit=amount,
            credit=0,
        )
        add_row(
            batch_id=batch_id,
            txn_date=txn_date,
            txn_type="AP_INVOICE",
            vendor_id=vendor_id,
            category="Accounts Payable",
            gl_code="2000",
            debit=0,
            credit=amount,
        )

    # 3 unbalanced journal entries
    unbalanced = [412.18, 1290.00, 75.55]
    for variance in unbalanced:
        amount = round(rng.uniform(1000, 5000), 2)
        txn_date = random_day()
        batch_id = next_batch()
        add_row(
            batch_id=batch_id,
            txn_date=txn_date,
            txn_type="JOURNAL",
            vendor_id=rng.choice(valid_vendor_ids),
            category="Software Licenses",
            gl_code="6200",
            debit=amount,
            credit=0,
        )
        add_row(
            batch_id=batch_id,
            txn_date=txn_date,
            txn_type="JOURNAL",
            vendor_id="",
            category="Accounts Payable",
            gl_code="2000",
            debit=0,
            credit=round(amount - variance, 2),
        )

    # Guarantee remaining dirty amount cells if the random budget was not used
    while dirty_amount_budget > 0:
        idx = rng.randrange(len(rows))
        if rows[idx]["debit_amount"] and "$" not in str(rows[idx]["debit_amount"]):
            try:
                value = float(rows[idx]["debit_amount"])
            except ValueError:
                continue
            rows[idx]["debit_amount"] = _messy_amount(value, rng, True)
            dirty_amount_budget -= 1

    _write_csv(
        RAW_DIR / "legacy_transactions.csv",
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
        ],
        rows,
    )
    print(f"Wrote {len(rows)} messy transactions to {RAW_DIR / 'legacy_transactions.csv'}")
    print(f"Wrote {len(VENDORS)} vendors and {len(CHART_OF_ACCOUNTS)} GL accounts.")


if __name__ == "__main__":
    generate()
