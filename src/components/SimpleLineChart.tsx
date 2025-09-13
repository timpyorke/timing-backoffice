import React, { useMemo, useRef, useState } from 'react';

type Point = { x: number; y: number };

interface SimpleLineChartProps {
  points: Point[]; // expects sorted by x
  width?: number; // if omitted, becomes responsive to container
  height?: number;
  color?: string;
  strokeWidth?: number;
  padding?: number; // uniform padding (top/right/bottom), except left can be overridden
  paddingLeft?: number; // override left padding to avoid y-label overlap
  showDots?: boolean;
  grid?: boolean;
  yFormatter?: (v: number) => string;
  xFormatter?: (v: number) => string;
  areaOpacity?: number;
  label?: string;
}

// Small, dependency-free SVG line chart with bezier smoothing and hover tooltip
const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  points,
  width,
  height = 260,
  color = '#2563eb', // tailwind blue-600
  strokeWidth = 2,
  padding = 32,
  paddingLeft,
  showDots = true,
  grid = true,
  yFormatter = (v) => `${v}`,
  xFormatter = (v) => `${v}`,
  areaOpacity = 0.12,
  label,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  // Observe container width for responsiveness
  React.useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        if (w && w !== measuredWidth) setMeasuredWidth(w);
      }
    });
    ro.observe(el);
    // initial
    setMeasuredWidth(Math.floor(el.clientWidth));
    return () => ro.disconnect();
  }, []);

  const svgW = Math.max(320, width ?? measuredWidth ?? 800);
  const [hover, setHover] = useState<{ cx: number; cy: number; p: Point } | null>(null);

  const { path, areaPath, xScale, yScale, yMax, xMin, xMax } = useMemo(() => {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = 0; // baseline at 0
    const yMax = Math.max(1, Math.max(...ys));

    const leftPad = paddingLeft ?? Math.max(40, padding); // ensure minimum space for labels
    const rightPad = padding;
    const innerW = Math.max(10, svgW - leftPad - rightPad);
    const innerH = height - padding * 2;

    const xScale = (x: number) => leftPad + ((x - xMin) / Math.max(1, xMax - xMin)) * innerW;
    const yScale = (y: number) => padding + innerH - ((y - yMin) / Math.max(1, yMax - yMin)) * innerH;

    // Bezier path for smoothing. Use Catmull–Rom to Bezier conversion (simple variant)
    const toPath = (pts: Point[]) => {
      if (pts.length === 0) return '';
      if (pts.length === 1) {
        const p = pts[0];
        return `M ${xScale(p.x)} ${yScale(p.y)}`;
      }
      const d: string[] = [];
      d.push(`M ${xScale(pts[0].x)} ${yScale(pts[0].y)}`);
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i === 0 ? 0 : i - 1];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] ?? p2;
        const c1x = xScale(p1.x + (p2.x - p0.x) / 6);
        const c1y = yScale(p1.y + (p2.y - p0.y) / 6);
        const c2x = xScale(p2.x - (p3.x - p1.x) / 6);
        const c2y = yScale(p2.y - (p3.y - p1.y) / 6);
        d.push(`C ${c1x} ${c1y}, ${c2x} ${c2y}, ${xScale(p2.x)} ${yScale(p2.y)}`);
      }
      return d.join(' ');
    };

    const path = toPath(points);
    const first = points[0];
    const last = points[points.length - 1];
    const areaPath = `${path} L ${xScale(last.x)} ${yScale(0)} L ${xScale(first.x)} ${yScale(0)} Z`;

    return { path, areaPath, xScale, yScale, yMax, xMin, xMax };
  }, [points, svgW, height, padding, paddingLeft]);

  // Generate simple grid (5 horizontal lines)
  const gridLines = useMemo(() => {
    if (!grid) return [] as number[];
    const lines: number[] = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) lines.push(i / steps);
    return lines;
  }, [grid]);

  // Nearest point for hover
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    // find nearest by x distance
    let best: { d: number; p: Point } | null = null;
    for (const p of points) {
      const px = xScale(p.x);
      const d = Math.abs(px - mx);
      if (!best || d < best.d) best = { d, p };
    }
    if (best) {
      setHover({ cx: xScale(best.p.x), cy: yScale(best.p.y), p: best.p });
    }
  };

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden" style={{ height }} onMouseLeave={() => setHover(null)}>
      <svg width={svgW} height={height} role="img" aria-label={label || 'Line chart'} onMouseMove={handleMouseMove}>
        {/* Background */}
        <rect x={0} y={0} width={svgW} height={height} fill="#ffffff" />

        {/* Grid lines */}
        {grid && gridLines.map((t, i) => {
          const y = padding + (height - padding * 2) * (1 - t);
          const lp = paddingLeft ?? Math.max(40, padding);
          return <line key={i} x1={lp} x2={svgW - padding} y1={y} y2={y} stroke="#e5e7eb" strokeWidth={1} />;
        })}

        {/* Y-axis labels */}
        {grid && gridLines.map((t, i) => {
          const y = padding + (height - padding * 2) * (1 - t);
          const val = Math.round((yMax) * t);
          return (
            <text key={i} x={8} y={y + 4} fontSize={10} fill="#6b7280">{yFormatter(val)}</text>
          );
        })}

        {/* X-axis ticks (0..23 if using hours) */}
        {Array.from({ length: 24 }).map((_, hour) => {
          const lp = paddingLeft ?? Math.max(40, padding);
          const rp = padding;
          const xx = lp + ((hour - (xMin ?? 0)) / Math.max(1, (xMax ?? 23) - (xMin ?? 0))) * (svgW - lp - rp);
          const showLabel = hour % 3 === 0; // label every 3 hours
          return (
            <g key={hour}>
              <line x1={xx} x2={xx} y1={height - padding} y2={height - padding + 4} stroke="#9ca3af" />
              {showLabel && (
                <text x={xx} y={height - padding + 16} fontSize={10} textAnchor="middle" fill="#6b7280">
                  {xFormatter(hour)}
                </text>
              )}
            </g>
          );
        })}

        {/* Area under curve */}
        <path d={areaPath} fill={color} opacity={areaOpacity} />
        {/* Line */}
        <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} />
        {/* Dots */}
        {showDots && points.map((p, i) => (
          <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={3} fill={color} />
        ))}

        {/* Hover marker */}
        {hover && (
          <g>
            <line x1={hover.cx} x2={hover.cx} y1={padding} y2={height - padding} stroke="#9ca3af" strokeDasharray="4 4" />
            <circle cx={hover.cx} cy={hover.cy} r={4} fill="#111827" stroke="#ffffff" strokeWidth={2} />
          </g>
        )}
      </svg>

      {hover && (
        <div
          className="absolute bg-white border border-gray-200 rounded shadow-sm px-2 py-1 text-xs pointer-events-none"
          style={{ left: Math.min(Math.max(hover.cx + 8, 0), svgW - 150), top: Math.max(hover.cy - 36, 0) }}
        >
          <div className="font-medium text-gray-800">Hour {hover.p.x}</div>
          <div className="text-gray-600">{label || 'Value'}: {yFormatter(hover.p.y)}</div>
        </div>
      )}
    </div>
  );
};

export default SimpleLineChart;
