export interface LineChartPoint {
    label: string;
    value: number;
}

export interface LineChartOptions {
    width: number;
    height: number;
    showArea: boolean;
    showGrid: boolean;
}

const PADDING = { top: 80, right: 50, bottom: 20, left: 20 };
const Y_AXIS_LABEL_WIDTH = 70;
const X_AXIS_LABEL_HEIGHT = 50;
const Y_AXIS_TICK_COUNT = 5;

function niceStep(rawStep: number): number {
    const exponent = Math.max(0, Math.floor(Math.log10(rawStep)));
    const magnitude = 10 ** exponent;
    const fraction = rawStep / magnitude;
    const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
    return niceFraction * magnitude;
}

export function computeYAxisTicks(maxValue: number, tickCount = Y_AXIS_TICK_COUNT): number[] {
    const safeMax = Math.max(maxValue, 1);
    const step = niceStep(safeMax / (tickCount - 1));
    return Array.from({ length: tickCount }, (_, i) => i * step);
}

export function renderLineChart(points: LineChartPoint[], options: LineChartOptions): string {
    const { width, height, showArea, showGrid } = options;

    const plotLeft = PADDING.left + Y_AXIS_LABEL_WIDTH;
    const plotRight = width - PADDING.right;
    const plotTop = PADDING.top;
    const plotBottom = height - PADDING.bottom - X_AXIS_LABEL_HEIGHT;

    const maxValue = Math.max(...points.map((p) => p.value), 0);
    const yTicks = computeYAxisTicks(maxValue);
    const yAxisMax = yTicks[yTicks.length - 1];

    const xForIndex = (i: number) =>
        points.length <= 1 ? plotLeft : plotLeft + (i / (points.length - 1)) * (plotRight - plotLeft);
    const yForValue = (v: number) => plotBottom - (v / yAxisMax) * (plotBottom - plotTop);

    const coords = points.map((p, i) => ({ x: xForIndex(i), y: yForValue(p.value), point: p }));

    const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join('');

    const areaPath = showArea
        ? `<path d="M${coords[0].x},${plotBottom}${coords
              .map((c) => `L${c.x},${c.y}`)
              .join('')}L${coords[coords.length - 1].x},${plotBottom}Z" class="ct-area"></path>`
        : '';

    const pointMarkers = coords
        .map((c) => `<line x1="${c.x}" y1="${c.y}" x2="${c.x + 0.01}" y2="${c.y}" class="ct-point"></line>`)
        .join('');

    const verticalGrid = showGrid
        ? coords
              .map((c) => `<line x1="${c.x}" x2="${c.x}" y1="${plotTop}" y2="${plotBottom}" class="ct-grid"></line>`)
              .join('')
        : '';
    const horizontalGrid = showGrid
        ? yTicks
              .map((tick) => {
                  const y = yForValue(tick);
                  return `<line x1="${plotLeft}" x2="${plotRight}" y1="${y}" y2="${y}" class="ct-grid"></line>`;
              })
              .join('')
        : '';

    const xLabels = coords
        .map((c) => `<text x="${c.x}" y="${plotBottom + 20}" class="ct-label ct-horizontal ct-end">${c.point.label}</text>`)
        .join('');
    const yLabels = yTicks
        .map((tick) => {
            const y = yForValue(tick);
            return `<text x="${plotLeft - 10}" y="${y}" class="ct-label ct-vertical ct-start">${tick}</text>`;
        })
        .join('');

    const xAxisTitle = `<text class="ct-axis-title ct-label" x="${(plotLeft + plotRight) / 2}" y="${
        height - 20
    }" dominant-baseline="text-after-edge" text-anchor="middle">Days</text>`;
    const yAxisCenter = (plotTop + plotBottom) / 2;
    const yAxisTitle = `<text class="ct-axis-title ct-label" x="20" y="${yAxisCenter}" transform="rotate(-90, 20, ${yAxisCenter})" dominant-baseline="hanging" text-anchor="middle">Contributions</text>`;

    const grids = showGrid ? `<g>${verticalGrid}${horizontalGrid}</g>` : '';

    return `<g class="ct-chart-line">${grids}<g><g class="ct-series ct-series-a"><path d="${linePath}" class="ct-line"></path>${areaPath}${pointMarkers}</g></g><g class="ct-labels">${xLabels}${yLabels}</g>${xAxisTitle}${yAxisTitle}</g>`;
}
