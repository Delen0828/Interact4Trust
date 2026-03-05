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
import re
import sys
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple

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


def parse_json_value(raw_text: str) -> Any:
    """Parse a JSON value that may be CSV-escaped."""
    text = raw_text.strip()
    if not text:
        raise ValueError("Input is empty.")

    candidates = [text]
    if text.startswith('"') and text.endswith('"') and '""' in text:
        candidates.append(text[1:-1].replace('""', '"'))

    last_error: Optional[Exception] = None
    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, str):
                parsed = json.loads(parsed)
            return parsed
        except Exception as exc:
            last_error = exc

    raise ValueError(f"Could not parse JSON value: {last_error}")


def parse_resolution(value: str) -> Tuple[int, int]:
    parts = value.lower().split("x")
    if len(parts) != 2:
        raise ValueError(
            f"Invalid resolution format '{value}', expected WxH (e.g. 1920x1080)"
        )

    width = int(parts[0])
    height = int(parts[1])
    if width <= 0 or height <= 0:
        raise ValueError("Resolution values must be positive integers.")
    return width, height


def normalize_condition_selector(value: str) -> str:
    text = value.strip()
    if not text:
        raise ValueError("Condition selectors cannot be empty.")

    if text.isdigit():
        return str(int(text))
    return text


def build_condition_aliases(*values: str) -> Set[str]:
    aliases: Set[str] = set()
    for value in values:
        text = value.strip()
        if not text:
            continue
        aliases.add(text)
        for match in re.findall(r"\d+", text):
            aliases.add(str(int(match)))
    return aliases


def normalize_yes_no(value: Any) -> Optional[str]:
    if not isinstance(value, str):
        return None

    text = value.strip().lower()
    if text == "yes":
        return "yes"
    if text == "no":
        return "no"
    return None


def classify_report_group(rows: List[Dict[str, str]]) -> Optional[str]:
    """Classify a participant as report or noreport from the feedback row."""
    for row in rows:
        if (row.get("trial_type") or "").strip() != "interaction-feedback":
            continue

        raw_feedback = (
            row.get("response", "").strip()
            or row.get("responses", "").strip()
        )
        if not raw_feedback:
            continue

        try:
            parsed = parse_json_value(raw_feedback)
        except ValueError:
            continue

        if not isinstance(parsed, dict):
            continue

        encounter_bug = normalize_yes_no(parsed.get("encounter_bug"))
        annoying_design = normalize_yes_no(parsed.get("annoying_design"))
        if encounter_bug is None or annoying_design is None:
            continue

        if encounter_bug == "no" and annoying_design == "no":
            return "noreport"
        return "report"

    return None


def first_nonempty(rows: List[Dict[str, str]], key: str) -> str:
    for row in rows:
        value = (row.get(key) or "").strip()
        if value:
            return value
    return ""


def load_from_csv(
    csv_path: Path,
    phase: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Read a CSV and return a list of dicts, one per matching prediction row.

    Each dict has keys: ``events`` (list), ``phase`` (int|None),
    ``condition``, ``condition_id``, ``condition_name``, ``participant_id``,
    ``screen_width``, ``screen_height``, ``report_group``.
    """
    results: List[Dict[str, Any]] = []
    with open(csv_path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        if "interaction_log" not in (reader.fieldnames or []):
            raise ValueError(
                f"{csv_path.name} has no 'interaction_log' column. "
                "Is this the right CSV?"
            )
        rows = list(reader)

        csv_report_group = classify_report_group(rows)
        csv_condition = first_nonempty(rows, "condition")
        csv_condition_id = first_nonempty(rows, "condition_id")
        csv_condition_name = first_nonempty(rows, "condition_name")
        csv_participant_id = first_nonempty(rows, "participant_id")

        for row in rows:
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
                "condition": row.get("condition", "").strip() or csv_condition,
                "condition_id": row.get("condition_id", "").strip() or csv_condition_id,
                "condition_name": row.get("condition_name", "").strip() or csv_condition_name,
                "participant_id": row.get("participant_id", "").strip() or csv_participant_id,
                "screen_width": int(float(sw)) if sw else None,
                "screen_height": int(float(sh)) if sh else None,
                "report_group": csv_report_group,
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


def resolve_source_resolution(
    row: Dict[str, Any],
    fallback: Tuple[int, int],
) -> Tuple[int, int]:
    width = row.get("screen_width")
    height = row.get("screen_height")
    if isinstance(width, int) and isinstance(height, int) and width > 0 and height > 0:
        return width, height
    return fallback


def load_traces_from_directory(
    input_dir: Path,
    input_glob: str,
    phase: Optional[int],
    fallback_resolution: Tuple[int, int],
    condition_selector: Optional[str] = None,
    report_group: Optional[str] = None,
) -> List[Dict[str, Any]]:
    traces: List[Dict[str, Any]] = []
    for csv_path in sorted(input_dir.rglob(input_glob)):
        if not csv_path.is_file():
            continue

        try:
            rows = load_from_csv(csv_path, phase=phase)
        except ValueError:
            continue

        for row in rows:
            if condition_selector is not None:
                aliases = build_condition_aliases(
                    str(row.get("condition") or ""),
                    str(row.get("condition_id") or ""),
                    str(row.get("condition_name") or ""),
                )
                if condition_selector not in aliases:
                    continue

            if report_group is not None and row.get("report_group") != report_group:
                continue

            points = extract_points(row["events"])
            if not points:
                continue

            traces.append({
                "participant_id": str(row.get("participant_id") or csv_path.stem),
                "condition_id": str(row.get("condition_id") or ""),
                "phase": row.get("phase"),
                "report_group": row.get("report_group"),
                "points": points,
                "source_resolution": resolve_source_resolution(
                    row, fallback_resolution
                ),
            })
    return traces


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


def build_legend_handles(event_types: Iterable[str]) -> List[object]:
    import matplotlib.patches as mpatches

    ordered_types: List[str] = []
    for event_type in _TYPE_COLORS:
        if event_type in event_types:
            ordered_types.append(event_type)

    extra_types = sorted(
        event_type for event_type in set(event_types) if event_type not in _TYPE_COLORS
    )
    ordered_types.extend(extra_types)

    return [
        mpatches.Patch(
            color=_TYPE_COLORS.get(event_type, _DEFAULT_COLOR),
            label=event_type,
        )
        for event_type in ordered_types
    ]


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

        # Separate click events for larger, translucent markers
        non_click = [(x, y, c) for x, y, c, t in zip(xs, ys, colors, types) if t != "chart_click"]
        clicks = [(x, y, c) for x, y, c, t in zip(xs, ys, colors, types) if t == "chart_click"]

        if non_click:
            nc_xs, nc_ys, nc_cs = zip(*non_click)
            ax.scatter(nc_xs, nc_ys, c=list(nc_cs), s=30, alpha=0.85,
                       edgecolors="white", linewidths=0.5)
        if clicks:
            cl_xs, cl_ys, cl_cs = zip(*clicks)
            ax.scatter(cl_xs, cl_ys, c=list(cl_cs), s=350, alpha=0.3,
                       edgecolors="white", linewidths=1.0)

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

        # Separate click events for larger, translucent markers
        non_click = [(x, y, c) for x, y, c, t in zip(xs, ys, colors, types) if t != "chart_click"]
        clicks = [(x, y, c) for x, y, c, t in zip(xs, ys, colors, types) if t == "chart_click"]

        if non_click:
            nc_xs, nc_ys, nc_cs = zip(*non_click)
            ax.scatter(nc_xs, nc_ys, c=list(nc_cs), s=20, alpha=0.9,
                       edgecolors="none")
        if clicks:
            cl_xs, cl_ys, cl_cs = zip(*clicks)
            ax.scatter(cl_xs, cl_ys, c=list(cl_cs), s=350, alpha=0.3,
                       edgecolors="none")

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


def plot_traces(
    traces: List[Dict[str, Any]],
    output_path: Path,
    title: Optional[str] = None,
    screenshot_path: Optional[Path] = None,
    fallback_resolution: Tuple[int, int] = (1920, 1080),
    point_alpha: float = 0.14,
    click_alpha: float = 0.10,
    line_alpha: float = 0.05,
    point_size: float = 18,
    click_size: float = 160,
) -> Tuple[int, int]:
    """Plot multiple traces onto one figure without connecting separate traces."""
    try:
        import matplotlib.image as mpimg
        import matplotlib.pyplot as plt
    except ImportError as exc:
        raise RuntimeError(
            "matplotlib is required. Install it with: pip install matplotlib"
        ) from exc

    if not traces:
        raise ValueError("No traces available to plot.")

    event_types: Set[str] = set()
    total_points = 0

    if screenshot_path is not None:
        img = mpimg.imread(str(screenshot_path))
        img_h, img_w = img.shape[:2]
        dpi = 100
        fig, ax = plt.subplots(figsize=(img_w / dpi, img_h / dpi), dpi=dpi)
        ax.imshow(img, extent=[0, img_w, img_h, 0], aspect="auto")

        for trace in traces:
            src_w, src_h = trace.get("source_resolution") or fallback_resolution
            xs = [x * (img_w / src_w) for _, x, _, _ in trace["points"]]
            ys = [y * (img_h / src_h) for _, _, y, _ in trace["points"]]
            types = [event_type for _, _, _, event_type in trace["points"]]
            colors = [_TYPE_COLORS.get(event_type, _DEFAULT_COLOR) for event_type in types]

            event_types.update(types)
            total_points += len(trace["points"])

            non_click = [
                (x, y, color)
                for x, y, color, event_type in zip(xs, ys, colors, types)
                if event_type != "chart_click"
            ]
            clicks = [
                (x, y, color)
                for x, y, color, event_type in zip(xs, ys, colors, types)
                if event_type == "chart_click"
            ]

            if non_click:
                nc_xs, nc_ys, nc_colors = zip(*non_click)
                ax.scatter(
                    nc_xs,
                    nc_ys,
                    c=list(nc_colors),
                    s=point_size,
                    alpha=point_alpha,
                    edgecolors="none",
                )
            if clicks:
                click_xs, click_ys, click_colors = zip(*clicks)
                ax.scatter(
                    click_xs,
                    click_ys,
                    c=list(click_colors),
                    s=click_size,
                    alpha=click_alpha,
                    edgecolors="white",
                    linewidths=0.3,
                )
            if len(xs) > 1 and line_alpha > 0:
                ax.plot(xs, ys, linewidth=0.5, alpha=line_alpha, color="#ffffff")

        ax.set_xlim(0, img_w)
        ax.set_ylim(img_h, 0)
        ax.set_aspect("equal", adjustable="box")
        ax.axis("off")

        legend_handles = build_legend_handles(event_types)
        fig.suptitle(title or "Interaction Trace Overlay", fontsize=10)
        if legend_handles:
            fig.legend(
                handles=legend_handles,
                loc="lower center",
                ncol=max(1, min(4, len(legend_handles))),
                fontsize=8,
                frameon=False,
            )
            fig.tight_layout(rect=[0, 0.05, 1, 1])
        else:
            fig.tight_layout()
    else:
        canvas_w = max(
            int((trace.get("source_resolution") or fallback_resolution)[0])
            for trace in traces
        )
        canvas_h = max(
            int((trace.get("source_resolution") or fallback_resolution)[1])
            for trace in traces
        )
        fig, ax = plt.subplots(figsize=(9, 7))

        for trace in traces:
            src_w, src_h = trace.get("source_resolution") or fallback_resolution
            xs = [x for _, x, _, _ in trace["points"]]
            ys = [src_h - y for _, _, y, _ in trace["points"]]
            types = [event_type for _, _, _, event_type in trace["points"]]
            colors = [_TYPE_COLORS.get(event_type, _DEFAULT_COLOR) for event_type in types]

            event_types.update(types)
            total_points += len(trace["points"])

            non_click = [
                (x, y, color)
                for x, y, color, event_type in zip(xs, ys, colors, types)
                if event_type != "chart_click"
            ]
            clicks = [
                (x, y, color)
                for x, y, color, event_type in zip(xs, ys, colors, types)
                if event_type == "chart_click"
            ]

            if non_click:
                nc_xs, nc_ys, nc_colors = zip(*non_click)
                ax.scatter(
                    nc_xs,
                    nc_ys,
                    c=list(nc_colors),
                    s=point_size,
                    alpha=point_alpha,
                    edgecolors="none",
                )
            if clicks:
                click_xs, click_ys, click_colors = zip(*clicks)
                ax.scatter(
                    click_xs,
                    click_ys,
                    c=list(click_colors),
                    s=click_size,
                    alpha=click_alpha,
                    edgecolors="none",
                )
            if len(xs) > 1 and line_alpha > 0:
                ax.plot(xs, ys, linewidth=0.5, alpha=line_alpha, color="#333333")

        ax.set_xlabel("x")
        ax.set_ylabel(f"{canvas_h} - y")
        ax.set_xlim(0, canvas_w)
        ax.set_ylim(0, canvas_h)
        ax.grid(alpha=0.2)
        ax.set_aspect("equal", adjustable="box")

        legend_handles = build_legend_handles(event_types)
        fig.suptitle(title or "Recovered Interaction Trace")
        if legend_handles:
            fig.legend(
                handles=legend_handles,
                loc="lower center",
                ncol=max(1, min(4, len(legend_handles))),
                fontsize=8,
                frameon=False,
            )
            fig.tight_layout(rect=[0, 0.05, 1, 1])
        else:
            fig.tight_layout()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    save_kwargs = {"dpi": 100 if screenshot_path is not None else 180}
    if screenshot_path is not None:
        save_kwargs["bbox_inches"] = "tight"
    fig.savefig(output_path, **save_kwargs)
    plt.close(fig)
    return len(traces), total_points


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
        help=(
            "Path to input file (.csv with interaction_log column, or .json array), "
            "or a directory of participant CSVs for aggregated overlays."
        ),
    )
    parser.add_argument(
        "output", nargs="?", default=None,
        help="Output PNG path (default: derived from screenshot or input name).",
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
    parser.add_argument(
        "--condition", default=None,
        help=(
            "Condition selector for directory input. Accepts numeric IDs such as 18 "
            "or full labels such as condition_18_glitch_hover."
        ),
    )
    parser.add_argument(
        "--input-glob", default="*.csv",
        help="Glob used to discover CSV files when input is a directory.",
    )
    parser.add_argument(
        "--report-group", choices=["report", "noreport"], default=None,
        help=(
            "Optional feedback-group filter for directory input. "
            "'report' keeps participants who answered Yes to encounter_bug or "
            "annoying_design. 'noreport' keeps only No/No participants."
        ),
    )
    parser.add_argument(
        "--allow-empty", action="store_true",
        help="Exit successfully without writing output when directory filters match no traces.",
    )
    parser.add_argument(
        "--point-alpha", type=float, default=0.14,
        help="Alpha value for non-click points in aggregated overlays.",
    )
    parser.add_argument(
        "--click-alpha", type=float, default=0.10,
        help="Alpha value for click points in aggregated overlays.",
    )
    parser.add_argument(
        "--line-alpha", type=float, default=0.05,
        help="Alpha value for per-trace path lines in aggregated overlays.",
    )
    parser.add_argument(
        "--point-size", type=float, default=18,
        help="Marker size for non-click points in aggregated overlays.",
    )
    parser.add_argument(
        "--click-size", type=float, default=160,
        help="Marker size for click points in aggregated overlays.",
    )
    args = parser.parse_args()

    try:
        input_path = Path(args.input)
        ss = Path(args.screenshot) if args.screenshot else None

        if not input_path.exists():
            raise ValueError(f"Input path not found: {input_path}")

        res = parse_resolution(args.resolution) if args.resolution else None

        if input_path.is_dir():
            if args.condition is None:
                raise ValueError("--condition is required when input is a directory.")

            condition_selector = normalize_condition_selector(args.condition)
            fallback_resolution = res or (1920, 1080)
            if args.output is not None:
                default_output = args.output
            else:
                report_suffix = f"-{args.report_group}" if args.report_group else ""
                default_output = f"overlay-c{condition_selector}{report_suffix}.png"

            traces = load_traces_from_directory(
                input_dir=input_path,
                input_glob=args.input_glob,
                phase=args.phase,
                fallback_resolution=fallback_resolution,
                condition_selector=condition_selector,
                report_group=args.report_group,
            )
            if not traces:
                message = f"No traces matched condition '{condition_selector}'"
                if args.report_group:
                    message += f" with report group '{args.report_group}'"
                if args.phase is not None:
                    message += f" in phase {args.phase}"

                if args.allow_empty:
                    print(message)
                    return
                raise ValueError(message)

            title = args.title
            if title is None:
                title = f"Condition {condition_selector} Overlay"
                if args.report_group == "report":
                    title += " (Bug or Bad Design)"
                elif args.report_group == "noreport":
                    title += " (No Bug / No Bad Design)"

            trace_count, point_count = plot_traces(
                traces,
                Path(default_output),
                title=title,
                screenshot_path=ss,
                fallback_resolution=fallback_resolution,
                point_alpha=args.point_alpha,
                click_alpha=args.click_alpha,
                line_alpha=args.line_alpha,
                point_size=args.point_size,
                click_size=args.click_size,
            )
            mode = "overlay" if ss else "standalone"
            group_label = f", group={args.report_group}" if args.report_group else ""
            print(
                f"Condition {condition_selector}: "
                f"{trace_count} traces, {point_count} points -> {default_output} "
                f"({mode}{group_label})"
            )
            return

        # Derive default output base from screenshot name (or input name).
        if args.output is not None:
            default_output = args.output
        elif ss is not None:
            default_output = f"{ss.stem}_recover.png"
        else:
            default_output = f"{input_path.stem}_recover.png"

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
                    out = Path(default_output)
                else:
                    base = Path(default_output)
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
            plot_points(points, Path(default_output), args.title, ss, res)
            mode = "overlay" if ss else "standalone"
            print(f"Saved {len(points)} points to {default_output} ({mode})")

    except Exception as exc:
        raise SystemExit(f"Error: {exc}")


if __name__ == "__main__":
    main()
