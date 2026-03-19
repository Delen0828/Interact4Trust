#!/usr/bin/env python3
"""Collect participant IDs from CSV files in Experiment1, Experiment2, and Experiment3."""

from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path

EXPERIMENT_DIRS = ("Experiment1", "Experiment2", "Experiment3")
USER_CSV_NAME_RE = re.compile(
    r"^user_(?P<participant_id>.+?)_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}\.csv$"
)


def _normalize_header(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", (name or "").strip().lower())


NORMALIZED_ID_HEADERS = {
    _normalize_header("participant_id"),
    _normalize_header("participant id"),
    _normalize_header("participantId"),
    _normalize_header("user_id"),
    _normalize_header("user id"),
    _normalize_header("userId"),
    _normalize_header("worker_id"),
    _normalize_header("worker id"),
    _normalize_header("workerId"),
    _normalize_header("prolific_id"),
    _normalize_header("prolific id"),
    _normalize_header("prolificId"),
}


def _configure_csv_field_limit() -> None:
    size = sys.maxsize
    while True:
        try:
            csv.field_size_limit(size)
            return
        except OverflowError:
            size //= 10


def _participant_id_from_filename(path: Path) -> str | None:
    match = USER_CSV_NAME_RE.match(path.name)
    if not match:
        return None
    participant_id = match.group("participant_id").strip()
    return participant_id or None


def _participant_column(fieldnames: list[str] | None) -> str | None:
    if not fieldnames:
        return None

    for name in fieldnames:
        if _normalize_header(name) in NORMALIZED_ID_HEADERS:
            return name

    for name in fieldnames:
        normalized = _normalize_header(name)
        if "participant" in normalized and "id" in normalized:
            return name

    return None


def _participant_ids_from_csv(path: Path) -> set[str]:
    ids: set[str] = set()
    try:
        with path.open("r", encoding="utf-8-sig", newline="", errors="replace") as handle:
            reader = csv.DictReader(handle)
            id_column = _participant_column(reader.fieldnames)
            if not id_column:
                return ids

            for row in reader:
                value = (row.get(id_column) or "").strip()
                if value and value.lower() not in {"null", "none", "nan"}:
                    ids.add(value)
    except (OSError, csv.Error) as exc:
        print(f"Warning: could not parse {path}: {exc}", file=sys.stderr)

    return ids


def collect_participant_ids(base_dir: Path, experiments: tuple[str, ...]) -> tuple[list[str], int]:
    participant_ids: set[str] = set()
    csv_count = 0

    for experiment_name in experiments:
        experiment_dir = base_dir / experiment_name
        if not experiment_dir.exists():
            continue

        for csv_path in sorted(experiment_dir.rglob("*.csv")):
            csv_count += 1

            id_from_filename = _participant_id_from_filename(csv_path)
            if id_from_filename:
                participant_ids.add(id_from_filename)

            participant_ids.update(_participant_ids_from_csv(csv_path))

    return sorted(participant_ids), csv_count


def main() -> None:
    _configure_csv_field_limit()

    script_dir = Path(__file__).resolve().parent
    default_base_dir = script_dir.parent
    default_output_path = script_dir / "participant_ids.txt"

    parser = argparse.ArgumentParser(
        description=(
            "Collect participant IDs from CSVs in Experiment1, Experiment2, and Experiment3, "
            "then save them to a comma-separated .txt file."
        )
    )
    parser.add_argument(
        "--base-dir",
        type=Path,
        default=default_base_dir,
        help=f"Project root directory (default: {default_base_dir})",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=default_output_path,
        help=f"Output .txt file path (default: {default_output_path})",
    )
    parser.add_argument(
        "--experiments",
        nargs="+",
        default=list(EXPERIMENT_DIRS),
        help=f"Experiment folders to scan (default: {' '.join(EXPERIMENT_DIRS)})",
    )
    args = parser.parse_args()

    experiment_names = tuple(args.experiments)
    ids, csv_count = collect_participant_ids(args.base_dir.resolve(), experiment_names)

    output_path = args.output.resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(",".join(ids) + ("\n" if ids else ""), encoding="utf-8")

    print(f"Scanned {csv_count} CSV files.")
    print(f"Collected {len(ids)} unique participant IDs.")
    print(f"Saved IDs to: {output_path}")


if __name__ == "__main__":
    main()
