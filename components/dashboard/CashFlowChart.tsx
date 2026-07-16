// ============================================================
// CASH FLOW CHART — A thin SVG line chart, no card, no border
// ============================================================
//
// WHY SVG (not a chart library)?
// For a chart this simple — a single line showing net cashflow
// over 6 months — a chart library like Recharts adds 300KB+ to
// your bundle for something that's 80 lines of SVG.
//
// SVG stands for Scalable Vector Graphics. It's a browser-native
// format for drawing shapes. The browser renders it natively —
// no JavaScript needed, renders in any size without pixelation.
//
// HOW THIS SVG CHART WORKS:
// 1. We have data points: [{ month: "Feb", net: 45000 }, ...]
// 2. We map net values to Y coordinates (bigger number = higher up)
// 3. We map month indices to X coordinates (spread evenly)
// 4. We connect the points with a <polyline> element
// 5. Optional: fill the area below with a gradient <polygon>
//
// WHY NO CARD WRAPPER?
// The brief says: "thin line chart directly below [the balance]
// with no border/card." The chart should feel like it's part of
// the page, not a separate widget. No card = more editorial feel.
// ============================================================

interface CashFlowChartProps {
  data: Array<{
    month: string;
    income: number;
    expenses: number;
    net: number;
  }>;
}

export default function CashFlowChart({ data }: CashFlowChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <p className="muted" style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
          — no cash flow data —
        </p>
      </div>
    );
  }
  
  // ── Chart dimensions ───────────────────────────────────────
  const WIDTH = 600;
  const HEIGHT = 80;        // deliberately low — this is a sparkline, not a full chart
  const PADDING_X = 8;
  const PADDING_Y = 10;
  
  // ── Map data to SVG coordinates ────────────────────────────
  const values = data.map(d => d.net);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1; // avoid division by zero
  
  // mapX: converts array index to X position on the SVG
  const mapX = (i: number) =>
    PADDING_X + (i / (data.length - 1)) * (WIDTH - PADDING_X * 2);
  
  // mapY: converts a value to Y position
  // NOTE: SVG Y axis is inverted — 0 is at top, height is at bottom
  // So we SUBTRACT from HEIGHT to flip: higher value = lower Y = higher on screen
  const mapY = (val: number) =>
    PADDING_Y + (1 - (val - minVal) / range) * (HEIGHT - PADDING_Y * 2);
  
  // Build the polyline points string: "x1,y1 x2,y2 x3,y3 ..."
  const linePoints = data
    .map((d, i) => `${mapX(i)},${mapY(d.net)}`)
    .join(" ");
  
  // Build the polygon points (for the area fill below the line)
  // We need to close the shape: go right-bottom, then left-bottom
  const lastX = mapX(data.length - 1);
  const firstX = mapX(0);
  const bottomY = HEIGHT - PADDING_Y;
  const areaPoints = `${firstX},${bottomY} ${linePoints} ${lastX},${bottomY}`;
  
  // Determine line color based on overall trend
  const netTrend = values[values.length - 1] - values[0];
  const lineColor = netTrend >= 0 ? "var(--gain)" : "var(--loss)";
  
  return (
    <div className="cashflow-chart">
      <div className="chart-header">
        <span className="label">Monthly Cash Flow</span>
        <span className="chart-period muted" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem" }}>
          last 6 months
        </span>
      </div>
      
      {/* 
        * SVG viewport: viewBox="0 0 600 80"
        * This means our coordinate space is 600 wide, 80 tall.
        * The SVG scales to fill its container — no fixed pixel size.
        */}
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="chart-svg"
        role="img"
        aria-label="Monthly cash flow line chart"
        preserveAspectRatio="none"
      >
        {/* Gradient fill below the line */}
        <defs>
          <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <polygon
          points={areaPoints}
          fill="url(#area-gradient)"
        />
        
        {/* The line itself */}
        <polyline
          points={linePoints}
          fill="none"
          stroke={lineColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points — small circles at each month */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={mapX(i)}
            cy={mapY(d.net)}
            r="2.5"
            fill={d.net >= 0 ? "var(--gain)" : "var(--loss)"}
            stroke="var(--paper)"
            strokeWidth="1"
          />
        ))}
      </svg>
      
      {/* Month labels below the chart */}
      <div className="chart-labels">
        {data.map((d, i) => (
          <span key={i} className="chart-month-label label">
            {d.month}
          </span>
        ))}
      </div>
      
      <style jsx>{`
        .cashflow-chart {
          padding: var(--space-6) 0;
          border-bottom: 1px solid var(--hairline);
        }
        
        .chart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-4);
        }
        
        /* 
         * The SVG takes full width of its container
         * height: 80px — deliberately compact
         * This keeps it feeling like an annotation on the data,
         * not a dominant chart widget
         */
        .chart-svg {
          width: 100%;
          height: 80px;
          display: block;
        }
        
        .chart-labels {
          display: flex;
          justify-content: space-between;
          margin-top: var(--space-2);
        }
        
        .chart-month-label {
          font-size: 0.625rem;
          color: var(--ink-faint);
        }
        
        .chart-empty {
          padding: var(--space-6) 0;
          text-align: center;
          border-bottom: 1px solid var(--hairline);
        }
      `}</style>
    </div>
  );
}
