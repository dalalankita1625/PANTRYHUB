"""End-to-end: generate messy extracts → clean → SQLite validate → Excel kit."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from generate_legacy_data import generate  # noqa: E402
from transform import transform  # noqa: E402
from load_and_validate import main as load_and_validate  # noqa: E402
from build_excel_kit import build  # noqa: E402


def main() -> None:
    print("=== 1/4  Generate messy legacy CSVs ===")
    generate()
    print("=== 2/4  Transform & quarantine ===")
    transform()
    print("=== 3/4  Load SQLite & run SQL pack ===")
    load_and_validate()
    print("=== 4/4  Build Excel reconciliation kit ===")
    build()
    print("\nDone.")
    print(f"  Raw CSVs     : {ROOT / 'data' / 'raw'}")
    print(f"  Staging CSVs : {ROOT / 'data' / 'staging'}")
    print(f"  SQLite DB    : {ROOT / 'data' / 'erp_staging.sqlite'}")
    print(f"  SQL reports  : {ROOT / 'data' / 'reports'}")
    print(f"  Excel kit    : {ROOT / 'excel' / 'ERP_Migration_Reconciliation_Kit.xlsx'}")


if __name__ == "__main__":
    main()
