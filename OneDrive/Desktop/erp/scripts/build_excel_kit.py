"""Build the Excel reconciliation & mapping workbook with XLOOKUP formulas."""

from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path

import pandas as pd
from openpyxl import Workbook
from openpyxl.chart import BarChart, Reference
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.table import Table, TableStyleInfo

ROOT = Path(__file__).resolve().parents[1]
STAGING_DIR = ROOT / "data" / "staging"
REPORTS_DIR = ROOT / "data" / "reports"
CONFIG_DIR = ROOT / "config"
OUT_PATH = ROOT / "excel" / "ERP_Migration_Reconciliation_Kit.xlsx"

NAVY = "1B365D"
GOLD = "C4A35A"
GREEN = "1F7A4D"
RED = "B42318"
AMBER = "B54708"
LIGHT = "F4F1EA"
WHITE = "FFFFFF"
PALE = "EEF2F6"
PALE_GREEN = "E8F5EE"
PALE_RED = "FDECEC"
PALE_AMBER = "FFF6E5"

thin = Border(
    left=Side(style="thin", color="D0D5DD"),
    right=Side(style="thin", color="D0D5DD"),
    top=Side(style="thin", color="D0D5DD"),
    bottom=Side(style="thin", color="D0D5DD"),
)


def fill(color: str) -> PatternFill:
    return PatternFill("solid", fgColor=color)


def font(bold=False, color=WHITE, size=11) -> Font:
    return Font(name="Calibri", bold=bold, color=color, size=size)


def header_bar(ws, title: str, subtitle: str, last_col: int) -> None:
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=last_col)
    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=last_col)
    c1 = ws.cell(1, 1, title)
    c1.font = Font(name="Calibri", bold=True, color=WHITE, size=18)
    c1.fill = fill(NAVY)
    c1.alignment = Alignment(vertical="center", indent=1)
    c2 = ws.cell(2, 1, subtitle)
    c2.font = Font(name="Calibri", italic=True, color=NAVY, size=11)
    c2.fill = fill(LIGHT)
    ws.row_dimensions[1].height = 28
    ws.row_dimensions[2].height = 20
    for col in range(2, last_col + 1):
        ws.cell(1, col).fill = fill(NAVY)
        ws.cell(2, col).fill = fill(LIGHT)


def style_header_row(ws, row: int, cols: int) -> None:
    for col in range(1, cols + 1):
        cell = ws.cell(row, col)
        cell.font = font(bold=True)
        cell.fill = fill(NAVY)
        cell.alignment = Alignment(horizontal="center", wrap_text=True, vertical="center")
        cell.border = thin
    ws.row_dimensions[row].height = 22


def autosize(ws, min_width=12, max_width=42) -> None:
    for col in ws.columns:
        letter = get_column_letter(col[0].column)
        length = 0
        for cell in col:
            if cell.value is None:
                continue
            length = max(length, min(len(str(cell.value)), max_width))
        ws.column_dimensions[letter].width = max(min_width, length + 2)


def money(cell) -> None:
    cell.number_format = '"$"#,##0.00'


def write_df(ws, df: pd.DataFrame, start_row: int, start_col: int = 1) -> int:
    headers = list(df.columns)
    for i, name in enumerate(headers, start=start_col):
        ws.cell(start_row, i, name)
    style_header_row(ws, start_row, start_col + len(headers) - 1)
    for r_idx, row in enumerate(df.itertuples(index=False), start=start_row + 1):
        for c_idx, value in enumerate(row, start=start_col):
            cell = ws.cell(r_idx, c_idx, None if pd.isna(value) else value)
            cell.border = thin
            cell.font = Font(name="Calibri", size=10)
            if r_idx % 2 == 0:
                cell.fill = fill(PALE)
    return start_row + len(df)


def build() -> Path:
    mapping = pd.read_csv(CONFIG_DIR / "gl_mapping.csv", dtype=str).fillna("")
    txns = pd.read_csv(STAGING_DIR / "clean_transactions.csv")
    summary = pd.read_csv(STAGING_DIR / "transform_summary.csv").iloc[0]
    vendors = pd.read_csv(STAGING_DIR / "clean_vendors.csv", dtype=str).fillna("")
    exceptions = pd.read_csv(STAGING_DIR / "quarantine_exceptions.csv") if (STAGING_DIR / "quarantine_exceptions.csv").exists() else pd.DataFrame()
    aging = pd.read_csv(REPORTS_DIR / "ap_aging.csv") if (REPORTS_DIR / "ap_aging.csv").exists() else pd.DataFrame()
    unbalanced = pd.read_csv(REPORTS_DIR / "unbalanced_batches.csv") if (REPORTS_DIR / "unbalanced_batches.csv").exists() else pd.DataFrame()
    orphans = pd.read_csv(REPORTS_DIR / "orphan_vendors.csv") if (REPORTS_DIR / "orphan_vendors.csv").exists() else pd.DataFrame()
    unmapped = pd.read_csv(REPORTS_DIR / "unmapped_gl.csv") if (REPORTS_DIR / "unmapped_gl.csv").exists() else pd.DataFrame()
    clusters = pd.read_csv(REPORTS_DIR / "duplicate_vendor_clusters.csv") if (REPORTS_DIR / "duplicate_vendor_clusters.csv").exists() else pd.DataFrame()

    txns["txn_date"] = pd.to_datetime(txns["txn_date"], errors="coerce")
    txns["month"] = txns["txn_date"].dt.strftime("%Y-%m")
    ready = txns[txns["validation_status"] == "ERP_READY"].copy()
    quarantine = txns[txns["validation_status"] == "QUARANTINE"].copy()

    wb = Workbook()

    # ------------------------------------------------------------------
    # Cover / control
    # ------------------------------------------------------------------
    cover = wb.active
    cover.title = "0_Control_Panel"
    header_bar(
        cover,
        "Northstar SaaS  ·  Legacy → Cloud ERP Migration Kit",
        "Confidential workpapers  ·  Simulated NetSuite / Xero cutover  ·  FY2024 GL extract",
        8,
    )
    cover["A4"] = "Reconciliation control box"
    cover["A4"].font = Font(name="Calibri", bold=True, size=14, color=NAVY)

    labels = [
        ("Source legacy total (debits)", float(summary["source_debits"])),
        ("Source legacy total (credits)", float(summary["source_credits"])),
        ("Target ERP-ready total (debits)", float(summary["ready_debits"])),
        ("Quarantined error rows (debits)", float(summary["quarantine_debits"])),
        ("ERP-ready + quarantine (debits)", float(summary["ready_debits"]) + float(summary["quarantine_debits"])),
        ("Variance (must be $0.00)", float(summary["source_debits"]) - (float(summary["ready_debits"]) + float(summary["quarantine_debits"]))),
        ("Unbalanced journal batches", int(summary["unbalanced_batches"])),
        ("Orphan vendor transaction lines", int(summary["orphan_vendor_txns"])),
        ("Unmapped GL transaction lines", int(summary["unmapped_gl_txns"])),
        ("Duplicate vendor names merged", int(summary["duplicate_vendors_merged"])),
    ]
    cover["A6"] = "Metric"
    cover["B6"] = "Value"
    style_header_row(cover, 6, 2)
    for i, (label, value) in enumerate(labels, start=7):
        cover.cell(i, 1, label).border = thin
        cover.cell(i, 1).font = Font(name="Calibri", size=11)
        cell = cover.cell(i, 2, value)
        cell.border = thin
        if i <= 12:
            money(cell)
        if label.startswith("Variance"):
            cell.font = Font(name="Calibri", bold=True, color=GREEN if abs(value) < 0.005 else RED)
            cell.fill = fill(PALE_GREEN if abs(value) < 0.005 else PALE_RED)

    cover["D6"] = "Cutover recommendation"
    cover["D6"].font = font(bold=True)
    cover["D6"].fill = fill(NAVY)
    cover.merge_cells("D7:H11")
    rec = (
        "DO NOT load quarantine batches to production. Import sequence is Chart of Accounts → "
        "Vendor Master (golden records only) → ERP-ready GL. Re-extract orphan vendors V997–V999 / "
        "VX01 / V-GONE from the legacy AP subledger, assign GL codes to Misc/Unknown categories, "
        "and rebalance the 3 journals before the second mock conversion."
    )
    cover["D7"] = rec
    cover["D7"].alignment = Alignment(wrap_text=True, vertical="top")
    cover["D7"].fill = fill(PALE_AMBER)

    cover["A18"] = "Pipeline"
    cover["A18"].font = Font(name="Calibri", bold=True, size=14, color=NAVY)
    steps = [
        "1. Messy legacy CSV  (data/raw)",
        "2. Python cleaner  (dates, FX symbols, vendor fuzzy merge)",
        "3. SQLite staging  (FKs, trial balance, aging)",
        "4. Excel audit kit  (XLOOKUP mapping + reconciliation)",
        "5. Target ERP import file  (ERP_READY rows only)",
    ]
    for i, step in enumerate(steps, start=19):
        cover.cell(i, 1, step).font = Font(name="Calibri", size=12, color=NAVY)

    cover.column_dimensions["A"].width = 42
    cover.column_dimensions["B"].width = 22
    for col in range(4, 9):
        cover.column_dimensions[get_column_letter(col)].width = 16
    cover.freeze_panes = "A7"
    cover.print_title_rows = "1:2"
    cover.page_setup.orientation = "landscape"
    cover.page_setup.fitToPage = True
    cover.page_setup.fitToWidth = 1
    cover.page_setup.fitToHeight = 1
    cover.sheet_properties.pageSetUpPr.fitToPage = True

    # ------------------------------------------------------------------
    # Runbook
    # ------------------------------------------------------------------
    runbook = wb.create_sheet("1_Migration_Runbook")
    header_bar(
        runbook,
        "1  ·  Migration runbook & technical dependencies",
        "Owner: Integration Consultant  ·  Environment: SQLite staging → Cloud ERP sandbox → Production",
        8,
    )
    headers = ["Phase", "Workstream", "Dependency", "Owner", "Status", "Target date", "Duration (days)", "Risk notes"]
    for i, h in enumerate(headers, start=1):
        runbook.cell(4, i, h)
    style_header_row(runbook, 4, 8)

    cutover = date(2024, 12, 31)
    rows = [
        ("0", "Kickoff & data dictionary sign-off", "Finance + IT RACI", "PMO", "Complete", cutover - timedelta(days=45), 3, "Lock chart of accounts before mapping."),
        ("1", "Import Chart of Accounts", "Finance sign-off on 15 GL codes", "Controller", "Complete", cutover - timedelta(days=30), 2, "Do not allow new GL codes mid-cutover."),
        ("2", "Vendor master load (golden records)", "Phase 1 loaded; fuzzy dedupe complete", "AP Lead", "Complete", cutover - timedelta(days=23), 4, "AWS / Azure / Slack / GCP aliases merged."),
        ("3", "Open AP / AR balances", "Phases 1–2 loaded AND SQL variance = $0.00", "GL Accountant", "Blocked", cutover - timedelta(days=10), 5, "3 unbalanced journals + 5 orphan vendors."),
        ("4", "Historical GL (optional)", "Phase 3 mock conversion signed off", "Controller", "Not started", cutover - timedelta(days=3), 2, "Load FY2024 only; FY2023 stays in archive."),
        ("5", "Mock conversion #2", "Quarantine exceptions cleared", "Integration", "Not started", cutover - timedelta(days=2), 1, "Re-run SQL pack; screenshot trial balance."),
        ("6", "Production cutover window", "Mock #2 = $0.00 variance", "IT + Finance", "Not started", cutover, 1, "Weekend freeze; AP/AR entry halted Friday 5pm."),
        ("7", "Hypercare / reconciliation", "Production import complete", "Integration", "Not started", cutover + timedelta(days=5), 5, "Daily source-to-target pivot until close."),
    ]
    status_fill = {
        "Complete": PALE_GREEN,
        "Blocked": PALE_RED,
        "Not started": PALE,
    }
    for r, row in enumerate(rows, start=5):
        for c, value in enumerate(row, start=1):
            cell = runbook.cell(r, c, value)
            cell.border = thin
            cell.font = Font(name="Calibri", size=10)
            if c == 6:
                cell.number_format = "YYYY-MM-DD"
            if c == 5:
                cell.fill = fill(status_fill.get(str(value), WHITE))
                cell.alignment = Alignment(horizontal="center")

    dv = DataValidation(type="list", formula1='"Not started,In progress,Blocked,Complete"', allow_blank=False)
    runbook.add_data_validation(dv)
    dv.add("E5:E12")

    runbook["A15"] = "Critical path"
    runbook["A15"].font = Font(name="Calibri", bold=True, size=13, color=NAVY)
    runbook.merge_cells("A16:H18")
    runbook["A16"] = (
        "Chart of Accounts must land before Vendor Master because AP invoices require a valid 2000 - Accounts Payable "
        "code. Vendor Master must land before Open AP/AR because every invoice vendor_id is a foreign key. Open balances "
        "cannot move until SQL reports $0.00 trial-balance variance and zero orphan vendors. Historical GL is optional "
        "and is sequenced last so a failed history load cannot block go-live balances."
    )
    runbook["A16"].alignment = Alignment(wrap_text=True, vertical="top")

    autosize(runbook)
    runbook.column_dimensions["B"].width = 38
    runbook.column_dimensions["C"].width = 42
    runbook.column_dimensions["H"].width = 48
    runbook.freeze_panes = "A5"
    runbook.auto_filter.ref = "A4:H12"
    runbook.page_setup.orientation = "landscape"
    runbook.page_setup.fitToPage = True
    runbook.page_setup.fitToWidth = 1
    runbook.page_setup.fitToHeight = 1
    runbook.sheet_properties.pageSetUpPr.fitToPage = True

    # ------------------------------------------------------------------
    # GL Mapping
    # ------------------------------------------------------------------
    map_ws = wb.create_sheet("2_GL_Mapping")
    header_bar(
        map_ws,
        "2  ·  Cross-platform GL mapping",
        "Legacy expense categories  →  Target cloud ERP account codes  ·  XLOOKUP source table",
        4,
    )
    map_ws["A4"] = "Legacy_Category"
    map_ws["B4"] = "Target_GL_Code"
    map_ws["C4"] = "Target_Account_Name"
    map_ws["D4"] = "Account_Type"
    style_header_row(map_ws, 4, 4)
    mapping_rows = mapping[["legacy_category", "target_gl_code", "target_account_name", "account_type"]]
    for r, row in enumerate(mapping_rows.itertuples(index=False), start=5):
        for c, value in enumerate(row, start=1):
            cell = map_ws.cell(r, c, value)
            cell.border = thin
            if str(value).startswith("ERROR"):
                cell.fill = fill(PALE_RED)
                cell.font = Font(name="Calibri", color=RED, bold=True)
            elif r % 2 == 0:
                cell.fill = fill(PALE)
    last_map = 4 + len(mapping_rows)
    table = Table(displayName="GLMapping", ref=f"A4:D{last_map}")
    table.tableStyleInfo = TableStyleInfo(name="TableStyleMedium2", showRowStripes=True)
    map_ws.add_table(table)
    autosize(map_ws)
    map_ws.freeze_panes = "A5"
    map_ws.page_setup.orientation = "landscape"
    map_ws.page_setup.fitToPage = True
    map_ws.page_setup.fitToWidth = 1
    map_ws.page_setup.fitToHeight = 1
    map_ws.sheet_properties.pageSetUpPr.fitToPage = True

    # ------------------------------------------------------------------
    # Target ERP data with live XLOOKUP
    # ------------------------------------------------------------------
    target = wb.create_sheet("3_Target_ERP_Data")
    header_bar(
        target,
        "3  ·  Target ERP import file + live XLOOKUP",
        "Paste area is SQL export. Mapping columns are Excel formulas — change 2_GL_Mapping and this sheet recalculates.",
        14,
    )
    tgt_headers = [
        "txn_id",
        "journal_batch_id",
        "txn_date",
        "txn_type",
        "vendor_id",
        "legacy_category",
        "source_gl_code",
        "debit_amount",
        "credit_amount",
        "currency",
        "XLOOKUP_GL_Code",
        "XLOOKUP_Account",
        "Validation_Status",
        "Import_Flag",
    ]
    for i, h in enumerate(tgt_headers, start=1):
        target.cell(4, i, h)
    style_header_row(target, 4, 14)

    export_cols = [
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
    ]
    # Cap formula sheet at a recruiter-friendly size but keep full file in reports.
    sample = txns[export_cols].copy()
    sample["txn_date"] = sample["txn_date"].dt.strftime("%Y-%m-%d")
    # Prefer showing a mix of ready + quarantine so XLOOKUP errors are visible.
    q = txns[txns["validation_status"] == "QUARANTINE"][export_cols].copy()
    rdy = ready[export_cols].head(max(0, 400 - len(q))).copy()
    sample = pd.concat([q, rdy], ignore_index=True)
    sample["txn_date"] = pd.to_datetime(sample["txn_date"], errors="coerce").dt.strftime("%Y-%m-%d")

    last_map_row = last_map
    for r, row in enumerate(sample.itertuples(index=False), start=5):
        for c, value in enumerate(row, start=1):
            cell = target.cell(r, c, None if pd.isna(value) else value)
            cell.border = thin
            cell.font = Font(name="Calibri", size=9)
            if c in (8, 9):
                money(cell)
        # Live Excel formulas (XLOOKUP with IFNA fallback)
        gl_formula = (
            f'IFNA(XLOOKUP(F{r},\'2_GL_Mapping\'!$A$5:$A${last_map_row},'
            f'\'2_GL_Mapping\'!$B$5:$B${last_map_row}),"ERROR: UNMAPPED")'
        )
        acct_formula = (
            f'IFNA(XLOOKUP(F{r},\'2_GL_Mapping\'!$A$5:$A${last_map_row},'
            f'\'2_GL_Mapping\'!$C$5:$C${last_map_row}),"ERROR: UNMAPPED")'
        )
        target.cell(r, 11, f"={gl_formula}").border = thin
        target.cell(r, 12, f"={acct_formula}").border = thin
        target.cell(r, 13, f'=IF(OR(K{r}="ERROR: UNMAPPED",K{r}=""),"QUARANTINE","ERP_READY")').border = thin
        target.cell(r, 14, f'=IF(M{r}="ERP_READY","LOAD","HOLD")').border = thin

    last_tgt = 4 + len(sample)
    target.conditional_formatting.add(
        f"M5:M{last_tgt}",
        FormulaRule(formula=['$M5="QUARANTINE"'], fill=fill(PALE_RED), font=Font(color=RED, bold=True)),
    )
    target.conditional_formatting.add(
        f"M5:M{last_tgt}",
        FormulaRule(formula=['$M5="ERP_READY"'], fill=fill(PALE_GREEN), font=Font(color=GREEN, bold=True)),
    )
    target.auto_filter.ref = f"A4:N{last_tgt}"
    target.freeze_panes = "A5"
    for i, width in enumerate([14, 16, 12, 14, 12, 28, 14, 14, 14, 10, 18, 24, 18, 12], start=1):
        target.column_dimensions[get_column_letter(i)].width = width
    target.page_setup.orientation = "landscape"
    target.page_setup.fitToPage = True
    target.page_setup.fitToWidth = 1
    target.page_setup.fitToHeight = 1
    target.sheet_properties.pageSetUpPr.fitToPage = True
    target.oddHeader.left.text = "Northstar SaaS ERP Migration"
    target.oddFooter.right.text = "Page &P of &N"

    # ------------------------------------------------------------------
    # Dashboard
    # ------------------------------------------------------------------
    dash = wb.create_sheet("4_Reconciliation_Dashboard")
    header_bar(
        dash,
        "4  ·  Source vs target reconciliation dashboard",
        "Pivot-style summary by GL account and month  ·  Variance must equal $0.00 before production import",
        8,
    )

    dash["A4"] = "CONTROL TOTALS"
    dash["A4"].font = Font(name="Calibri", bold=True, size=12, color=NAVY)
    dash["A5"] = "Source legacy debits"
    dash["B5"] = float(summary["source_debits"])
    dash["A6"] = "Target ERP-ready debits"
    dash["B6"] = float(summary["ready_debits"])
    dash["A7"] = "Quarantine debits"
    dash["B7"] = float(summary["quarantine_debits"])
    dash["A8"] = "Target + quarantine"
    dash["B8"] = "=B6+B7"
    dash["A9"] = "Variance"
    dash["B9"] = "=B5-B8"
    for r in range(5, 10):
        dash.cell(r, 1).border = thin
        money(dash.cell(r, 2))
        dash.cell(r, 2).border = thin
        dash.cell(r, 2).font = Font(name="Calibri", size=12)
    dash["A9"].font = Font(name="Calibri", bold=True, color=NAVY)
    dash["B9"].font = Font(name="Calibri", bold=True, size=14, color=GREEN)
    dash["B9"].fill = fill(PALE_GREEN)
    dash["C9"] = '=IF(ABS(B9)<0.005,"PASS — balanced to the penny","FAIL — do not import")'
    dash["C9"].font = Font(name="Calibri", bold=True, color=GREEN)

    # Pivot-like: GL x month for ERP-ready
    coa = pd.read_csv(STAGING_DIR / "clean_chart_of_accounts.csv")
    ready_named = ready.merge(coa, on="gl_code", how="left")
    ready_named["gl_code"] = ready_named["gl_code"].map(
        lambda x: "UNMAPPED" if pd.isna(x) or str(x).strip() == "" else str(x).replace(".0", "")
    )
    ready_named["account_name"] = ready_named["account_name"].fillna("Unmapped").astype(str)
    ready_named["account_label"] = ready_named["gl_code"] + " - " + ready_named["account_name"]
    pivot = (
        ready_named.groupby(["account_label", "month"], dropna=False)
        .agg(debits=("debit_amount", "sum"), credits=("credit_amount", "sum"))
        .reset_index()
    )
    months = sorted([m for m in pivot["month"].dropna().unique()])
    accounts = sorted(pivot["account_label"].unique())
    dash["A11"] = "ERP-READY PIVOT  ·  Debits by GL account and month"
    dash["A11"].font = Font(name="Calibri", bold=True, size=12, color=NAVY)
    dash["A12"] = "Target_Account_Name"
    for i, month in enumerate(months, start=2):
        dash.cell(12, i, month)
    dash.cell(12, len(months) + 2, "Total")
    style_header_row(dash, 12, len(months) + 2)

    matrix = pivot.pivot_table(index="account_label", columns="month", values="debits", aggfunc="sum", fill_value=0)
    for r, acct in enumerate(accounts, start=13):
        dash.cell(r, 1, acct).border = thin
        for c, month in enumerate(months, start=2):
            val = float(matrix.loc[acct, month]) if acct in matrix.index and month in matrix.columns else 0.0
            cell = dash.cell(r, c, val)
            money(cell)
            cell.border = thin
        last_col = len(months) + 2
        start_letter = get_column_letter(2)
        end_letter = get_column_letter(len(months) + 1)
        cell = dash.cell(r, last_col, f"={start_letter}{r}:{end_letter}{r}" if False else f"=SUM({start_letter}{r}:{end_letter}{r})")
        money(cell)
        cell.border = thin
        cell.font = Font(name="Calibri", bold=True)

    total_row = 13 + len(accounts)
    dash.cell(total_row, 1, "Grand Total").font = Font(name="Calibri", bold=True, color=WHITE)
    dash.cell(total_row, 1).fill = fill(NAVY)
    dash.cell(total_row, 1).border = thin
    for c in range(2, len(months) + 3):
        letter = get_column_letter(c)
        cell = dash.cell(total_row, c, f"=SUM({letter}13:{letter}{total_row - 1})")
        money(cell)
        cell.font = Font(name="Calibri", bold=True, color=WHITE)
        cell.fill = fill(NAVY)
        cell.border = thin

    # Exception quarantine table
    q_start = total_row + 3
    dash.cell(q_start, 1, "ERROR QUARANTINE  ·  hold these rows out of the ERP load file").font = Font(
        name="Calibri", bold=True, size=12, color=RED
    )
    q_view = quarantine[
        ["txn_id", "journal_batch_id", "txn_date", "vendor_id", "legacy_category", "gl_code", "debit_amount", "credit_amount", "validation_status"]
    ].copy()
    q_view["txn_date"] = pd.to_datetime(q_view["txn_date"], errors="coerce").dt.strftime("%Y-%m-%d")
    write_df(dash, q_view, q_start + 1)

    dash.cell(4, 5, "AP AGING (credit balance on 2000)").font = Font(name="Calibri", bold=True, size=12, color=NAVY)
    dash.cell(5, 5, "Bucket")
    dash.cell(5, 6, "Invoices")
    dash.cell(5, 7, "AP balance")
    style_header_row(dash, 5, 7)
    dash.cell(5, 5).fill = fill(NAVY)
    for i, row in enumerate(aging.itertuples(index=False), start=6):
        dash.cell(i, 5, row.aging_bucket).border = thin
        dash.cell(i, 6, int(row.invoice_count)).border = thin
        cell = dash.cell(i, 7, float(row.ap_balance))
        money(cell)
        cell.border = thin

    dash.cell(11, 5, "EXCEPTION COUNTS FROM SQLITE").font = Font(name="Calibri", bold=True, size=12, color=NAVY)
    dash["E12"] = "Orphan vendor lines"
    dash["F12"] = int(len(orphans))
    dash["E13"] = "Unmapped GL lines"
    dash["F13"] = int(len(unmapped))
    dash["E14"] = "Unbalanced batches"
    dash["F14"] = int(len(unbalanced))
    dash["E15"] = "Vendor duplicate clusters"
    dash["F15"] = int(len(clusters))
    for r in range(12, 16):
        dash.cell(r, 5).border = thin
        dash.cell(r, 6).border = thin
        dash.cell(r, 6).fill = fill(PALE_AMBER)

    if not aging.empty:
        chart = BarChart()
        chart.type = "col"
        chart.title = "AP aging by bucket"
        chart.y_axis.title = "AP balance"
        data = Reference(dash, min_col=7, min_row=5, max_row=5 + len(aging))
        cats = Reference(dash, min_col=5, min_row=6, max_row=5 + len(aging))
        chart.add_data(data, titles_from_data=True)
        chart.set_categories(cats)
        chart.shape = 4
        chart.style = 10
        chart.legend = None
        dash.add_chart(chart, "E17")

    dash.column_dimensions["A"].width = 36
    for col in range(2, 16):
        dash.column_dimensions[get_column_letter(col)].width = 14
    dash.freeze_panes = "A13"
    dash.page_setup.orientation = "landscape"
    dash.page_setup.fitToPage = True
    dash.page_setup.fitToWidth = 1
    dash.page_setup.fitToHeight = 1
    dash.sheet_properties.pageSetUpPr.fitToPage = True

    # ------------------------------------------------------------------
    # Workpapers: SQL dumps
    # ------------------------------------------------------------------
    wp = wb.create_sheet("5_SQL_Workpapers")
    header_bar(
        wp,
        "5  ·  SQL validation workpapers",
        "Exported from data/erp_staging.sqlite  ·  screenshot these queries in DB Browser for SQLite for the Loom walkthrough",
        8,
    )
    wp["A4"] = "Unbalanced journal batches"
    wp["A4"].font = Font(name="Calibri", bold=True, size=12, color=NAVY)
    write_df(wp, unbalanced if not unbalanced.empty else pd.DataFrame({"note": ["None"]}), 5)

    start = 8 + max(len(unbalanced), 1)
    wp.cell(start, 1, "Orphan vendor invoices").font = Font(name="Calibri", bold=True, size=12, color=NAVY)
    write_df(wp, orphans if not orphans.empty else pd.DataFrame({"note": ["None"]}), start + 1)

    start2 = start + 4 + max(len(orphans), 1)
    wp.cell(start2, 1, "Vendor duplicate clusters (pre-golden-record view)").font = Font(
        name="Calibri", bold=True, size=12, color=NAVY
    )
    write_df(wp, clusters if not clusters.empty else pd.DataFrame({"note": ["None"]}), start2 + 1)
    autosize(wp)
    wp.page_setup.orientation = "landscape"
    wp.page_setup.fitToPage = True
    wp.page_setup.fitToWidth = 1
    wp.page_setup.fitToHeight = 1
    wp.sheet_properties.pageSetUpPr.fitToPage = True

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    wb.save(OUT_PATH)
    print(f"Wrote {OUT_PATH}")
    return OUT_PATH


if __name__ == "__main__":
    build()
