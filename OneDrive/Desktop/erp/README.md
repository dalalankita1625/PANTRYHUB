# Legacy-to-Cloud ERP Data Migration & GL Reconciliation Pipeline

End-to-end migration toolkit for a fictional B2B SaaS company (**Northstar SaaS**) moving AP/AR and GL extracts from a messy on-prem system into a cloud ERP (NetSuite / Xero-style chart of accounts).

The pipeline does the job an ERP / data-integration consultant actually does: clean the CSV dump, map it onto a proper accounting schema, catch bad rows in SQL **before** they hit production, and prove source-to-target financials reconcil in Excel.

```
Messy legacy CSV
    → Python cleaner (dates, currency, vendor fuzzy-merge)
    → SQLite staging (FKs, trial balance, AR/AP aging)
    → Target ERP CSV  +  Excel audit kit (XLOOKUP + pivot-style rec)
```

## What this project proves

| Requirement | Where it shows up |
| --- | --- |
| Excel: XLOOKUP, Pivot-style rec, data validation | `excel/ERP_Migration_Reconciliation_Kit.xlsx` |
| Power Query / repeatable CSV transforms | `excel/power_query_transforms.pq` |
| Relational schema + SQL | `sql/schema.sql`, `sql/validation.sql` |
| GL / AR / AP concepts | Debits = credits, AP aging, COA mapping |
| CSV formatting at scale | 750+ journal lines with mixed dates and `$1,250.00 USD` amounts |
| AI-assisted transformation scripts | `scripts/transform.py` (generated and then tightened) |
| Cutover dependencies / timelines | Sheet `1_Migration_Runbook` |

## Accounting edge cases the pipeline caught

These are injected on purpose in `data/raw/` so the SQL pack has something real to fail on:

1. **5 orphan vendor invoices (10 journal lines)** — `V997`, `V998`, `V999`, `VX01`, `V-GONE` do not exist on the vendor master. Loading them would break the ERP foreign key on Vendor.
2. **3 unbalanced journal batches** — Debits do not equal Credits inside the batch (`$412.18`, `$1,290.00`, `$75.55`). A cloud ERP would reject the whole journal.
3. **8 unmapped expense lines** (`Misc Expense`, `Unknown Category`, blank) — XLOOKUP returns `ERROR: UNMAPPED` and the whole journal is quarantined so the AP credit cannot load without its debit.
4. **4 duplicate vendor clusters / 5 alias rows merged** — `AWS` / `AWS Inc.` / `Amazon Web Services`, plus Google Cloud, Azure, and Slack aliases, collapsed to a golden record with `difflib` fuzzy matching.

Latest pipeline run (seed `42`): **756** journal lines → **724 ERP-ready** (debits = credits = `$3,982,442.88`) and **32 quarantined**. Source debits still equal ERP-ready + quarantine (`$4,004,032.68`), so the control-box variance is **`$0.00`**.

Reconciliation identity used in the control box:

```
Source legacy total  =  ERP-ready total  +  Quarantine total
Variance             =  $0.00
```

Rows in quarantine are **held out of the import file**, not dropped from the audit. That is how you keep a $0.00 tie-out without silently losing money.

## Project layout

```
config/gl_mapping.csv          Cross-platform category → GL code map
data/raw/                      Deliberately messy legacy extracts
data/staging/                  UTF-8 cleaned CSVs + exception log
data/reports/                  SQL validation exports
data/erp_staging.sqlite        Relational staging database
excel/ERP_Migration_Reconciliation_Kit.xlsx
excel/power_query_transforms.pq
scripts/generate_legacy_data.py
scripts/transform.py
scripts/load_and_validate.py
scripts/build_excel_kit.py
scripts/run_pipeline.py
sql/schema.sql
sql/validation.sql
```

## Workbook tabs

| Tab | Purpose |
| --- | --- |
| `0_Control_Panel` | Executive tie-out: source vs ERP-ready vs quarantine |
| `1_Migration_Runbook` | Phased cutover, owners, dates, FK dependencies |
| `2_GL_Mapping` | Legacy category → target GL (`XLOOKUP` source table) |
| `3_Target_ERP_Data` | Import file with live `XLOOKUP` / `IFNA` formulas |
| `4_Reconciliation_Dashboard` | GL × month pivot, AP aging chart, error quarantine |
| `5_SQL_Workpapers` | Unbalanced journals, orphan vendors, duplicate clusters |

XLOOKUP on the target sheet (Excel 365 / 2021):

```excel
=IFNA(XLOOKUP(F5,'2_GL_Mapping'!$A$5:$A$28,'2_GL_Mapping'!$B$5:$B$28),"ERROR: UNMAPPED")
=IF(OR(K5="ERROR: UNMAPPED",K5=""),"QUARANTINE","ERP_READY")
```

## How to run

```powershell
cd C:\Users\ADMIN\OneDrive\Desktop\erp
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python scripts\run_pipeline.py
```

Open:

- `excel\ERP_Migration_Reconciliation_Kit.xlsx` — enable formula calc; filter `Validation_Status = QUARANTINE`
- `data\erp_staging.sqlite` in [DB Browser for SQLite](https://sqlitebrowser.org/) and execute `sql\validation.sql`

Individual steps:

```powershell
python scripts\generate_legacy_data.py
python scripts\transform.py
python scripts\load_and_validate.py
python scripts\build_excel_kit.py
```

## SQL pack (pre-production)

Referential integrity:

```sql
SELECT t.txn_id, t.vendor_id, t.debit_amount, t.credit_amount
FROM gl_transactions t
LEFT JOIN vendors v ON t.vendor_id = v.vendor_id
WHERE t.vendor_id IS NOT NULL AND t.vendor_id <> '' AND v.vendor_id IS NULL;
```

Trial balance:

```sql
SELECT
    ROUND(SUM(debit_amount), 2)  AS total_debits,
    ROUND(SUM(credit_amount), 2) AS total_credits,
    ROUND(SUM(debit_amount) - SUM(credit_amount), 2) AS variance
FROM gl_transactions;
```

Unbalanced journals:

```sql
SELECT journal_batch_id,
       ROUND(SUM(debit_amount) - SUM(credit_amount), 2) AS variance
FROM gl_transactions
GROUP BY journal_batch_id
HAVING ROUND(SUM(debit_amount) - SUM(credit_amount), 2) <> 0;
```

## Resume bullets

- Designed an end-to-end Legacy-to-Cloud ERP data migration pipeline simulating the transformation of 756 AP/AR journal lines across relational schemas (`vendors`, `gl_transactions`, `chart_of_accounts`).
- Automated CSV cleansing, date standardization, and vendor deduplication in Python (fuzzy matching of legal-name variants such as AWS / Amazon Web Services).
- Built SQL validation to enforce referential integrity, trial-balance (Debits = Credits) by journal batch, unmapped GL detection, and AP aging buckets (0–30 / 31–60 / 61–90 / 90+).
- Developed an Excel reconciliation kit using `XLOOKUP`, conditional formatting, and a source-vs-target control box that ties out to **$0.00** while quarantining failed rows for re-extract.

## Suggested 2-minute walkthrough

1. Open the raw CSV and show mixed dates (`03/15/2024` vs `2024-03-15`) and `$1,250.00 USD` amounts.
2. Run (or show) `transform_summary.csv` — duplicate vendors merged, quarantine counts.
3. In DB Browser, run the orphan-vendor and unbalanced-batch queries.
4. In Excel, land on `4_Reconciliation_Dashboard`: variance **$0.00**, then filter quarantine on tab 3 and change a mapping on tab 2 to show `XLOOKUP` recalculate.

Synthetic data only. No client information.
