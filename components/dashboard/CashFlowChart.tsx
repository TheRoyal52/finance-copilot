// components/dashboard/CashFlowChart.tsx
// Server Component — pure SVG, no hooks needed. Styles in globals.css

interface CashFlowChartProps {
  data: Array<{ month: string; income: number; expenses: number; net: number; }>;
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

  const WIDTH = 600;
  const HEIGHT = 80;
  const PADDING_X = 8;
  const PADDING_Y = 10;

  const values = data.map(d => d.net);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const mapX = (i: number) =>
    PADDING_X + (i / (data.length - 1)) * (WIDTH - PADDING_X * 2);

  // SVG Y is inverted: 0 = top, HEIGHT = bottom
  // So we subtract to make higher values appear higher on screen
  const mapY = (val: number) =>
    PADDING_Y + (1 - (val - minVal) / range) * (HEIGHT - PADDING_Y * 2);

  const linePoints = data.map((d, i) => `${mapX(i)},${mapY(d.net)}`).join(" ");
  const lastX = mapX(data.length - 1);
  const firstX = mapX(0);
  const bottomY = HEIGHT - PADDING_Y;
  const areaPoints = `${firstX},${bottomY} ${linePoints} ${lastX},${bottomY}`;

  const netTrend = values[values.length - 1] - values[0];
  const lineColor = netTrend >= 0 ? "var(--gain)" : "var(--loss)";

  return (
    <div className="cashflow-chart">
      <div className="chart-header">
        <span className="label">Monthly Cash Flow</span>
        <span className="chart-period muted">last 6 months</span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="chart-svg"
        role="img"
        aria-label="Monthly cash flow line chart"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={lineColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        <polygon points={areaPoints} fill="url(#area-gradient)" />

        <polyline
          points={linePoints}
          fill="none"
          stroke={lineColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

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

      <div className="chart-labels">
        {data.map((d, i) => (
          <span key={i} className="chart-month-label label">{d.month}</span>
        ))}
      </div>
    </div>
  );
}
