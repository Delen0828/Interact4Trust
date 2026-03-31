#!/usr/bin/env python3
"""Generate condition-level interaction overlays from many participant CSVs."""

import argparse
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Set, Tuple

from recover_interaction_log import (
    _DEFAULT_COLOR,
    _TYPE_COLORS,
    extract_points,
    load_from_csv,
)


DEFAULT_RESOLUTION = (1920, 1080)


@dataclass
class Trace:
    participant_id: str
    condition_values: Tuple[str, ...]
    points: List[Tuple[float, float, float, str]]
    source_resolution: Tuple[int, int]


def parse_resolution(value: str) -> Tuple[int, int]:
    parts = value.lower().split("x")
    if len(parts) != 2:
        raise ValueError(
            f"Invalid resolution format '{value}', expected WxH (e.g. 1920x1080)."
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


def resolve_source_resolution(
    row: Dict[str, object],
    fallback: Tuple[int, int],
) -> Tuple[int, int]:
    width = row.get("screen_width")
    height = row.get("screen_height")
    if isinstance(width, int) and isinstance(height, int) and width > 0 and height > 0:
        return width, height
    return fallback


def load_traces(
    input_dir: Path,
    input_glob: str,
    phase: Optional[int],
    fallback_resolution: Tuple[int, int],
) -> List[Trace]:
    traces: List[Trace] = []
    for csv_path in sorted(input_dir.rglob(input_glob)):
        if not csv_path.is_file():
            continue

        try:
            rows = load_from_csv(csv_path, phase=phase)
        except ValueError:
            continue

        for row in rows:
            points = extract_points(row["events"])
            if not points:
                continue

            traces.append(
                Trace(
                    participant_id=str(row.get("participant_id") or csv_path.stem),
                    condition_values=(
                        str(row.get("condition") or ""),
                        str(row.get("condition_id") or ""),
                        str(row.get("condition_name") or ""),
                    ),
                    points=points,
                    source_resolution=resolve_source_resolution(
                        row, fallback_resolution
                    ),
                )
            )
    return traces


def group_traces_by_condition(
    traces: Iterable[Trace],
    selectors: Sequence[str],
) -> Dict[str, List[Trace]]:
    grouped: Dict[str, List[Trace]] = {selector: [] for selector in selectors}
    for trace in traces:
        aliases = build_condition_aliases(*trace.condition_values)
        for selector in selectors:
            if selector in aliases:
                grouped[selector].append(trace)
    return grouped


def render_path(pattern: str, condition: str) -> Path:
    return Path(pattern.format(condition=condition))


def build_legend_handles(event_types: Iterable[str]) -> List[object]:
    import matplotlib.patches as mpatches

    ordered_types: List[str] = []
    for key in _TYPE_COLORS:
        if key in event_types:
            ordered_types.append(key)

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


def plot_condition_overlay(
    traces: Sequence[Trace],
    screenshot_path: Path,
    output_path: Path,
    title: str,
    point_alpha: float,
    click_alpha: float,
    line_alpha: float,
    point_size: float,
    click_size: float,
) -> Tuple[int, int]:
    try:
        import matplotlib.image as mpimg
        import matplotlib.pyplot as plt
    except ImportError as exc:
        raise RuntimeError(
            "matplotlib is required. Install it with: pip install matplotlib"
        ) from exc

    if not traces:
        raise ValueError("No traces available for this condition.")
    if not screenshot_path.exists():
        raise FileNotFoundError(f"Screenshot not found: {screenshot_path}")

    dpi = 100
    img = mpimg.imread(str(screenshot_path))
    img_h, img_w = img.shape[:2]

    fig, ax = plt.subplots(figsize=(img_w / dpi, img_h / dpi), dpi=dpi)
    total_points, _ = draw_condition_overlay(
        ax=ax,
        traces=traces,
        screenshot_path=screenshot_path,
        point_alpha=point_alpha,
        click_alpha=click_alpha,
        line_alpha=line_alpha,
        point_size=point_size,
        click_size=click_size,
    )

    fig.tight_layout(pad=0)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=dpi)
    plt.close(fig)
    return len(traces), total_points


def draw_condition_overlay(
    ax: object,
    traces: Sequence[Trace],
    screenshot_path: Path,
    point_alpha: float,
    click_alpha: float,
    line_alpha: float,
    point_size: float,
    click_size: float,
) -> Tuple[int, Set[str]]:
    import matplotlib.image as mpimg

    img = mpimg.imread(str(screenshot_path))
    img_h, img_w = img.shape[:2]
    ax.imshow(img, extent=[0, img_w, img_h, 0], aspect="auto")

    event_types: Set[str] = set()
    total_points = 0

    for trace in traces:
        src_w, src_h = trace.source_resolution
        scale_x = img_w / src_w
        scale_y = img_h / src_h

        xs = [x * scale_x for _, x, _, _ in trace.points]
        ys = [y * scale_y for _, _, y, _ in trace.points]
        types = [event_type for _, _, _, event_type in trace.points]
        colors = [_TYPE_COLORS.get(event_type, _DEFAULT_COLOR) for event_type in types]

        event_types.update(types)
        total_points += len(trace.points)

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
        # Keep only dots in output (no path lines).

    ax.set_xlim(0, img_w)
    ax.set_ylim(img_h, 0)
    ax.set_aspect("equal", adjustable="box")
    ax.axis("off")
    return total_points, event_types


def plot_combined_overlay(
    traces: Sequence[Trace],
    screenshot_path: Path,
    output_path: Path,
    title: str,
    point_alpha: float,
    click_alpha: float,
    line_alpha: float,
    point_size: float,
    click_size: float,
) -> Tuple[int, int]:
    try:
        import matplotlib.pyplot as plt
    except ImportError as exc:
        raise RuntimeError(
            "matplotlib is required. Install it with: pip install matplotlib"
        ) from exc

    if not traces:
        raise ValueError("No traces available for combined output.")
    if not screenshot_path.exists():
        raise FileNotFoundError(f"Screenshot not found: {screenshot_path}")

    import matplotlib.image as mpimg

    img = mpimg.imread(str(screenshot_path))
    img_h, img_w = img.shape[:2]
    dpi = 100
    fig, ax = plt.subplots(figsize=(img_w / dpi, img_h / dpi), dpi=dpi)

    combined_points, _ = draw_condition_overlay(
        ax=ax,
        traces=traces,
        screenshot_path=screenshot_path,
        point_alpha=point_alpha,
        click_alpha=click_alpha,
        line_alpha=line_alpha,
        point_size=point_size,
        click_size=click_size,
    )

    fig.tight_layout(pad=0)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=dpi)
    plt.close(fig)
    return len(traces), combined_points


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Batch-generate condition-level interaction overlays from participant CSVs."
        )
    )
    parser.add_argument(
        "input_dir",
        help="Directory containing participant CSV exports.",
    )
    parser.add_argument(
        "--conditions",
        nargs="+",
        required=True,
        help=(
            "Condition selectors to render. Selectors can be numeric IDs such as 18 "
            "or full condition labels such as condition_18_glitch_hover."
        ),
    )
    parser.add_argument(
        "--output-dir",
        default="overlay_output",
        help="Directory for generated overlay images.",
    )
    parser.add_argument(
        "--input-glob",
        default="*.csv",
        help="Glob used to discover input CSV files under input_dir.",
    )
    parser.add_argument(
        "--screenshot-pattern",
        required=True,
        help="Screenshot path pattern. Use {condition} as a placeholder.",
    )
    parser.add_argument(
        "--output-pattern",
        default="overlay-c{condition}.png",
        help="Output filename pattern inside output-dir. Use {condition} as a placeholder.",
    )
    parser.add_argument(
        "--title-pattern",
        default="Condition {condition} Overlay",
        help="Plot title pattern. Use {condition} as a placeholder.",
    )
    parser.add_argument(
        "--combined-output",
        default=None,
        help=(
            "Optional combined output filename or absolute path. When provided, "
            "all selected traces are also rendered onto one base screenshot."
        ),
    )
    parser.add_argument(
        "--combined-title",
        default="Combined Condition Overlay",
        help="Title for the combined overlay figure.",
    )
    parser.add_argument(
        "--combined-base-condition",
        default=None,
        help=(
            "Condition selector used to choose the base screenshot for the combined "
            "overlay. Ignored when --combined-screenshot is provided."
        ),
    )
    parser.add_argument(
        "--combined-screenshot",
        default=None,
        help="Explicit screenshot path for the combined overlay base image.",
    )
    parser.add_argument(
        "--resolution",
        default="1920x1080",
        metavar="WxH",
        help="Fallback source screen resolution when a row does not include one.",
    )
    parser.add_argument(
        "--phase",
        type=int,
        choices=[1, 2],
        default=None,
        help="Optional phase filter for CSV rows.",
    )
    parser.add_argument(
        "--point-alpha",
        type=float,
        default=0.14,
        help="Alpha value for non-click points.",
    )
    parser.add_argument(
        "--click-alpha",
        type=float,
        default=0.10,
        help="Alpha value for click points.",
    )
    parser.add_argument(
        "--line-alpha",
        type=float,
        default=0.05,
        help="Alpha value for per-trace path lines.",
    )
    parser.add_argument(
        "--point-size",
        type=float,
        default=18,
        help="Marker size for non-click points.",
    )
    parser.add_argument(
        "--click-size",
        type=float,
        default=160,
        help="Marker size for click points.",
    )
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    if not input_dir.exists():
        raise SystemExit(f"Error: input directory not found: {input_dir}")

    try:
        fallback_resolution = parse_resolution(args.resolution)
    except ValueError as exc:
        raise SystemExit(f"Error: {exc}")

    try:
        selectors = [normalize_condition_selector(value) for value in args.conditions]
    except ValueError as exc:
        raise SystemExit(f"Error: {exc}")

    traces = load_traces(
        input_dir=input_dir,
        input_glob=args.input_glob,
        phase=args.phase,
        fallback_resolution=fallback_resolution,
    )
    if not traces:
        raise SystemExit("Error: no interaction traces found in the input directory.")

    grouped_traces = group_traces_by_condition(traces, selectors)
    output_dir = Path(args.output_dir)
    combined_traces: List[Trace] = []

    for selector in selectors:
        condition_traces = grouped_traces.get(selector, [])
        if not condition_traces:
            raise SystemExit(
                f"Error: no traces matched condition selector '{selector}'."
            )

        screenshot_path = render_path(args.screenshot_pattern, selector)
        output_path = output_dir / render_path(args.output_pattern, selector)
        title = args.title_pattern.format(condition=selector)
        combined_traces.extend(condition_traces)

        trace_count, point_count = plot_condition_overlay(
            traces=condition_traces,
            screenshot_path=screenshot_path,
            output_path=output_path,
            title=title,
            point_alpha=args.point_alpha,
            click_alpha=args.click_alpha,
            line_alpha=args.line_alpha,
            point_size=args.point_size,
            click_size=args.click_size,
        )
        print(
            f"Condition {selector}: {trace_count} traces, {point_count} points -> "
            f"{output_path}"
        )

    if args.combined_output:
        combined_output_path = Path(args.combined_output)
        if not combined_output_path.is_absolute():
            combined_output_path = output_dir / combined_output_path

        if args.combined_screenshot:
            combined_screenshot_path = Path(args.combined_screenshot)
        else:
            combined_base_condition = args.combined_base_condition or selectors[0]
            combined_screenshot_path = render_path(
                args.screenshot_pattern, normalize_condition_selector(combined_base_condition)
            )

        trace_count, point_count = plot_combined_overlay(
            traces=combined_traces,
            screenshot_path=combined_screenshot_path,
            output_path=combined_output_path,
            title=args.combined_title,
            point_alpha=args.point_alpha,
            click_alpha=args.click_alpha,
            line_alpha=args.line_alpha,
            point_size=args.point_size,
            click_size=args.click_size,
        )
        print(
            f"Combined overlay: {trace_count} traces, {point_count} points -> "
            f"{combined_output_path} (base {combined_screenshot_path})"
        )


if __name__ == "__main__":
    main()
