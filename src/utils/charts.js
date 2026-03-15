const SVG_NS = "http://www.w3.org/2000/svg";

export function createSvg(width, height) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  return svg;
}

export function createLine(x1, y1, x2, y2, stroke, strokeWidth = 1, opts = {}) {
  const line = document.createElementNS(SVG_NS, "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("stroke", stroke);
  line.setAttribute("stroke-width", strokeWidth);
  if (opts.dasharray) line.setAttribute("stroke-dasharray", opts.dasharray);
  if (opts.opacity) line.setAttribute("opacity", opts.opacity);
  return line;
}

export function createPath(
  d,
  stroke,
  strokeWidth = 2,
  fill = "none",
  opts = {},
) {
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", d);
  path.setAttribute("stroke", stroke);
  path.setAttribute("stroke-width", strokeWidth);
  path.setAttribute("fill", fill);
  if (opts.opacity) path.setAttribute("opacity", opts.opacity);
  if (opts.dasharray) path.setAttribute("stroke-dasharray", opts.dasharray);
  return path;
}

export function createRect(x, y, width, height, fill, opts = {}) {
  const rect = document.createElementNS(SVG_NS, "rect");
  rect.setAttribute("x", x);
  rect.setAttribute("y", y);
  rect.setAttribute("width", width);
  rect.setAttribute("height", height);
  rect.setAttribute("fill", fill);
  if (opts.opacity) rect.setAttribute("opacity", opts.opacity);
  return rect;
}

export function createCircle(cx, cy, r, fill, opts = {}) {
  const circle = document.createElementNS(SVG_NS, "circle");
  circle.setAttribute("cx", cx);
  circle.setAttribute("cy", cy);
  circle.setAttribute("r", r);
  circle.setAttribute("fill", fill);
  if (opts.stroke) {
    circle.setAttribute("stroke", opts.stroke);
    circle.setAttribute("stroke-width", opts.strokeWidth || 1);
  }
  return circle;
}

export function createText(
  x,
  y,
  text,
  fill = "#9ca3af",
  fontSize = 12,
  opts = {},
) {
  const el = document.createElementNS(SVG_NS, "text");
  el.setAttribute("x", x);
  el.setAttribute("y", y);
  el.setAttribute("fill", fill);
  el.setAttribute("font-size", fontSize);
  if (opts.anchor) el.setAttribute("text-anchor", opts.anchor);
  if (opts.weight) el.setAttribute("font-weight", opts.weight);
  if (opts.transform) el.setAttribute("transform", opts.transform);
  el.textContent = text;
  return el;
}

export function drawAxes(svg, padding, chartWidth, chartHeight) {
  svg.appendChild(
    createLine(
      padding.left,
      padding.top + chartHeight,
      padding.left + chartWidth,
      padding.top + chartHeight,
      "#9ca3af",
      2,
    ),
  );
  svg.appendChild(
    createLine(
      padding.left,
      padding.top,
      padding.left,
      padding.top + chartHeight,
      "#9ca3af",
      2,
    ),
  );
}

export function drawGridLines(
  svg,
  padding,
  chartWidth,
  chartHeight,
  count = 5,
) {
  for (let i = 0; i <= count; i++) {
    const y = padding.top + (i * chartHeight) / count;
    svg.appendChild(
      createLine(padding.left, y, padding.left + chartWidth, y, "#374151", 1, {
        opacity: "0.3",
      }),
    );
  }
}

export function drawYAxisLabels(
  svg,
  padding,
  chartHeight,
  maxValue,
  formatFn,
  count = 5,
) {
  for (let i = 0; i <= count; i++) {
    const value = (maxValue / count) * (count - i);
    const y = padding.top + (i * chartHeight) / count + 5;
    svg.appendChild(
      createText(padding.left - 10, y, formatFn(value), "#9ca3af", 10, {
        anchor: "end",
      }),
    );
  }
}

export function addLegend(svg, padding, height, items) {
  const legendY = height - 35;
  let currentX = padding.left;

  items.forEach((item) => {
    svg.appendChild(
      createLine(currentX, legendY, currentX + 20, legendY, item.color, 3, {
        dasharray: item.dashed ? "5,5" : undefined,
      }),
    );
    svg.appendChild(
      createText(currentX + 25, legendY + 4, item.label, "#9ca3af", 12),
    );
    currentX += 180;
  });
}
