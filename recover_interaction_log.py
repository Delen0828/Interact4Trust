#!/usr/bin/env python3
"""Recover interaction traces from an event log and export them as a PNG.

Accepts either:
  - A raw CSV file exported by the experiment (auto-detects the
    ``interaction_log`` column and ``phase`` column).
  - A plain JSON array of events (legacy format).

For each interaction event with positional data this script reads
``data.x``, ``data.y``, and the event ``type``.
"""

import argparse
import csv
import json
import sys
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

# The interaction_log column can easily exceed the default 128 KB CSV field
# size limit, so raise it before any CSV reading happens.
csv.field_size_limit(sys.maxsize)


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------

def parse_events_json(raw_text: str) -> List[dict[str, Any]]:
    """Parse a raw JSON string (possibly CSV-escaped) into an event list."""
    text = raw_text.strip()
    if not text:
        raise ValueError("Input is empty.")

    candidates = [text]

    # Common when logs are exported from CSV as one quoted field.
    if text.startswith('"') and text.endswith('"') and '""' in text:
        candidates.append(text[1:-1].replace('""', '"'))

    last_error: Optional[Exception] = None
    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, str):
                parsed = json.loads(parsed)
            if not isinstance(parsed, list):
                raise ValueError("Top-level JSON must be an array of events.")
            return parsed
        except Exception as exc:
            last_error = exc

    raise ValueError(f"Could not parse interaction log as JSON: {last_error}")


def load_from_csv(
    csv_path: Path,
    phase: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Read a CSV and return a list of dicts, one per matching prediction row.

    Each dict has keys: ``events`` (list), ``phase`` (int|None),
    ``condition_id``, ``participant_id``, ``screen_width``, ``screen_height``.
    """
    results: List[Dict[str, Any]] = []
    with open(csv_path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        if "interaction_log" not in (reader.fieldnames or []):
            raise ValueError(
                f"{csv_path.name} has no 'interaction_log' column. "
                "Is this the right CSV?"
            )
        for row in reader:
            log_raw = row.get("interaction_log", "").strip()
            if not log_raw:
                continue

            row_phase_str = row.get("phase", "").strip()
            row_phase = int(row_phase_str) if row_phase_str else None

            # Filter by phase if requested.
            if phase is not None and row_phase != phase:
                continue

            try:
                events = parse_events_json(log_raw)
            except ValueError:
                continue

            # Try to read screen resolution from the row (new data).
            sw = row.get("screen_width", "").strip()
            sh = row.get("screen_height", "").strip()

            results.append({
                "events": events,
                "phase": row_phase,
                "condition_id": row.get("condition_id", ""),
                "participant_id": row.get("participant_id", ""),
                "screen_width": int(float(sw)) if sw else None,
                "screen_height": int(float(sh)) if sh else None,
            })

    if not results:
        extra = f" for phase {phase}" if phase is not None else ""
        raise ValueError(
            f"No rows with interaction_log data found in {csv_path.name}{extra}."
        )
    return results


# ---------------------------------------------------------------------------
# Point extraction
# ---------------------------------------------------------------------------

def extract_points(events: Iterable[dict[str, Any]]) -> List[Tuple[float, float, float, str]]:
    """Extract (timestamp, x, y, event_type) from events that have positional data."""
    points: List[Tuple[float, float, float, str]] = []

    for event in events:
        if not isinstance(event, dict):
            continue

        event_type = event.get("type", "")
        if not event_type:
            continue

        data = event.get("data")
        if not isinstance(data, dict):
            continue

        x = data.get("x")
        y = data.get("y")
        ts = data.get("timestamp", event.get("timestamp"))

        if isinstance(x, (int, float)) and isinstance(y, (int, float)) and isinstance(ts, (int, float)):
            points.append((float(ts), float(x), float(y), str(event_type)))

    points.sort(key=lambda p: p[0])
    return points


# ---------------------------------------------------------------------------
# Plotting
# ---------------------------------------------------------------------------

_TYPE_COLORS: Dict[str, str] = {
    "chart_hover":  "#1f77b4",   # blue
    "chart_click":  "#d62728",   # red
    "chart_enter":  "#2ca02c",   # green
    "chart_leave":  "#ff7f0e",   # orange
    "hover_enter":  "#9467bd",   # purple
    "hover_leave":  "#8c564b",   # brown
}
_DEFAULT_COLOR = "#7f7f7f"       # grey for unknown types


def plot_points(
    points: List[Tuple[float, float, float, str]],
    output_path: Path,
    title: Optional[str] = None,
    screenshot_path: Optional[Path] = None,
    source_resolution: Optional[Tuple[int, int]] = None,
) -> None:
    """Plot interaction points coloured by event type.

    Parameters
    ----------
    source_resolution : (width, height) of the screen where the interaction
        was recorded (from trial data ``screen_width`` / ``screen_height``).
        When a screenshot is provided and its pixel dimensions differ from
        source_resolution, coordinates are rescaled so the trail aligns with
        the screenshot.  Defaults to (1920, 1080) when not given.
    """
    try:
        import matplotlib.pyplot as plt
        import matplotlib.patches as mpatches
        import matplotlib.image as mpimg
    except ImportError as exc:
        raise RuntimeError(
            "matplotlib is required. Install it with: pip install matplotlib"
        ) from exc

    if not points:
        raise ValueError("No valid interaction points found.")

    src_w, src_h = source_resolution or (1920, 1080)

    raw_xs = [x for _, x, _, _ in points]
    raw_ys = [y for _, _, y, _ in points]
    types  = [t for _, _, _, t in points]

    # Map each point to its colour.
    colors = [_TYPE_COLORS.get(t, _DEFAULT_COLOR) for t in types]

    # Build legend handles for the types actually present.
    seen_types: List[str] = []
    for t in types:
        if t not in seen_types:
            seen_types.append(t)

    legend_handles = [
        mpatches.Patch(
            color=_TYPE_COLORS.get(t, _DEFAULT_COLOR),
            label=t,
        )
        for t in seen_types
    ]

    if screenshot_path is not None:
        # --- Overlay mode: render trail on top of screenshot ---
        img = mpimg.imread(str(screenshot_path))
        img_h, img_w = img.shape[:2]

        scale_x = img_w / src_w
        scale_y = img_h / src_h
        xs = [x * scale_x for x in raw_xs]
        ys = [y * scale_y for y in raw_ys]

        dpi = 100
        fig, ax = plt.subplots(
            figsize=(img_w / dpi, img_h / dpi), dpi=dpi
        )

        ax.imshow(img, extent=[0, img_w, img_h, 0], aspect="auto")

        ax.scatter(
            xs, ys,
            c=colors,
            s=30, alpha=0.85,
            edgecolors="white", linewidths=0.5,
        )
        ax.plot(xs, ys, linewidth=0.8, alpha=0.3, color="#ffffff")

        ax.set_xlim(0, img_w)
        ax.set_ylim(img_h, 0)
        ax.set_aspect("equal", adjustable="box")
        ax.axis("off")

        if scale_x != 1.0 or scale_y != 1.0:
            subtitle = f"source {src_w}x{src_h} -> screenshot {img_w}x{img_h}"
            fig.text(0.5, 0.01, subtitle, ha="center", fontsize=7, color="gray")

        fig.suptitle(title or "Interaction Trace Overlay", fontsize=10)
        fig.legend(
            handles=legend_handles, loc="lower center",
            ncol=len(legend_handles), fontsize=8, frameon=False,
        )
        fig.tight_layout(rect=[0, 0.04, 1, 1])

        output_path.parent.mkdir(parents=True, exist_ok=True)
        fig.savefig(output_path, dpi=dpi, bbox_inches="tight")
        plt.close(fig)

    else:
        # --- Original mode: blank canvas with flipped Y ---
        xs = raw_xs
        ys = [src_h - y for y in raw_ys]

        fig, ax = plt.subplots(figsize=(9, 7))

        ax.scatter(
            xs, ys,
            c=colors,
            s=20, alpha=0.9,
            edgecolors="none",
        )
        ax.plot(xs, ys, linewidth=0.8, alpha=0.25, color="#333333")

        ax.set_xlabel("x")
        ax.set_ylabel(f"{src_h} - y")
        ax.set_xlim(0, src_w)
        ax.set_ylim(0, src_h)
        ax.grid(alpha=0.2)
        ax.set_aspect("equal", adjustable="box")

        fig.suptitle(title or "Recovered Interaction Trace")
        fig.legend(
            handles=legend_handles, loc="lower center",
            ncol=len(legend_handles), fontsize=9, frameon=False,
        )
        fig.tight_layout(rect=[0, 0.04, 1, 1])

        output_path.parent.mkdir(parents=True, exist_ok=True)
        fig.savefig(output_path, dpi=180)
        plt.close(fig)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Recover interaction log to PNG. "
        "Accepts a raw experiment CSV or a plain JSON event array.",
    )
    parser.add_argument(
        "input",
        help="Path to input file (.csv with interaction_log column, or .json array).",
    )
    parser.add_argument(
        "output", nargs="?", default="interaction_recovered.png",
        help="Output PNG path (default: interaction_recovered.png).",
    )
    parser.add_argument("--title", default=None, help="Optional plot title.")
    parser.add_argument(
        "--screenshot", default=None,
        help="Path to screenshot PNG to use as background for overlay.",
    )
    parser.add_argument(
        "--resolution", default=None, metavar="WxH",
        help="Source screen resolution as WxH (e.g. 1920x1080). "
             "Logged coordinates are rescaled to match the screenshot. "
             "Defaults to 1920x1080.",
    )
    parser.add_argument(
        "--phase", default=None, type=int, choices=[1, 2],
        help="Which phase to extract from a CSV (1 or 2). "
             "If omitted, all prediction-task rows with interaction data are used.",
    )
    args = parser.parse_args()

    try:
        input_path = Path(args.input)
        ss = Path(args.screenshot) if args.screenshot else None

        res = None
        if args.resolution:
            parts = args.resolution.lower().split("x")
            if len(parts) != 2:
                raise ValueError(
                    f"Invalid resolution format '{args.resolution}', "
                    "expected WxH (e.g. 1920x1080)"
                )
            res = (int(parts[0]), int(parts[1]))

        # --- Detect input format ---
        if input_path.suffix.lower() == ".csv":
            rows = load_from_csv(input_path, phase=args.phase)
            for row_info in rows:
                events = row_info["events"]
                points = extract_points(events)
                if not points:
                    print(f"  Skipping phase {row_info['phase']}: no interaction points")
                    continue

                # Use screen resolution from CSV if available and not overridden.
                row_res = res
                if row_res is None and row_info["screen_width"] and row_info["screen_height"]:
                    row_res = (row_info["screen_width"], row_info["screen_height"])

                # Build output path: insert phase number if multiple rows.
                if len(rows) == 1:
                    out = Path(args.output)
                else:
                    base = Path(args.output)
                    out = base.with_stem(
                        f"{base.stem}_phase{row_info['phase']}"
                    )

                # Build title.
                t = args.title
                if t is None:
                    pid = row_info["participant_id"] or input_path.stem
                    cond = row_info["condition_id"] or ""
                    t = f"{pid}  phase {row_info['phase']}"
                    if cond:
                        t += f"  ({cond})"

                plot_points(points, out, t, ss, row_res)
                mode = "overlay" if ss else "standalone"
                print(
                    f"Phase {row_info['phase']}: "
                    f"{len(points)} points -> {out} ({mode})"
                )
        else:
            # Legacy: plain JSON array input.
            raw_text = input_path.read_text(encoding="utf-8")
            events = parse_events_json(raw_text)
            points = extract_points(events)
            plot_points(points, Path(args.output), args.title, ss, res)
            mode = "overlay" if ss else "standalone"
            print(f"Saved {len(points)} points to {args.output} ({mode})")

    except Exception as exc:
        raise SystemExit(f"Error: {exc}")


if __name__ == "__main__":
    main()
