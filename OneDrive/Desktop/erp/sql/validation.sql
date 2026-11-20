-- Pre-migration validation pack.
-- Run after loading cleaned CSVs into the staging SQLite database.

-- 1. Referential integrity: invoices tied to a vendor_id that does not exist.
SELECT
    t.txn_id,
    t.vendor_id,
    t.legacy_category,
    t.debit_amount,
    t.credit_amount
FROM gl_transactions t
LEFT JOIN vendors v ON t.vendor_id = v.vendor_id
WHERE t.vendor_id IS NOT NULL
  AND t.vendor_id <> ''
  AND v.vendor_id IS NULL;

-- 2. Trial balance: company-wide Debits vs Credits.
SELECT
    ROUND(SUM(debit_amount), 2)  AS total_debits,
    ROUND(SUM(credit_amount), 2) AS total_credits,
    ROUND(SUM(debit_amount) - SUM(credit_amount), 2) AS variance
FROM gl_transactions;

-- 3. Unbalanced journal batches (Debits <> Credits per journal_batch_id).
SELECT
    journal_batch_id,
    COUNT(*) AS line_count,
    ROUND(SUM(debit_amount), 2)  AS batch_debits,
    ROUND(SUM(credit_amount), 2) AS batch_credits,
    ROUND(SUM(debit_amount) - SUM(credit_amount), 2) AS variance
FROM gl_transactions
GROUP BY journal_batch_id
HAVING ROUND(SUM(debit_amount) - SUM(credit_amount), 2) <> 0;

-- 4. Unmapped / missing GL codes.
SELECT
    txn_id,
    journal_batch_id,
    legacy_category,
    gl_code,
    debit_amount,
    credit_amount
FROM gl_transactions
WHERE gl_code IS NULL
   OR gl_code = ''
   OR gl_code NOT IN (SELECT gl_code FROM chart_of_accounts);

-- 5. AR/AP aging (as of 2024-12-31) for open AP invoices.
WITH as_of AS (
    SELECT DATE('2024-12-31') AS as_of_date
)
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
WHERE t.txn_type = 'AP_INVOICE'
GROUP BY aging_bucket
ORDER BY
    CASE aging_bucket
        WHEN '0-30' THEN 1
        WHEN '31-60' THEN 2
        WHEN '61-90' THEN 3
        ELSE 4
    END;

-- 6. Duplicate vendor clusters still present in the master after fuzzy merge.
SELECT
    canonical_name,
    COUNT(*) AS name_variants,
    GROUP_CONCAT(vendor_name, ' | ') AS variants
FROM vendors
GROUP BY canonical_name
HAVING COUNT(*) > 1;
