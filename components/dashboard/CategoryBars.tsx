// components/dashboard/CategoryBars.tsx
// Server Component — no hooks. Styles in globals.css

interface CategoryBarsProps {
  data: Array<{ name: string; amount: number; percentage: number; }>;
  budgets?: Array<{
    category: string; limit: number; spent: number;
    percentage: number; overBudget: boolean;
  }>;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(amount);
}

export default function CategoryBars({ data, budgets }: CategoryBarsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="categories-empty">
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--ink-faint)" }}>
          — no spending data this month —
        </p>
      </div>
    );
  }

  return (
    <div className="category-bars">
      <div className="section-header">
        <span className="label">Spending by Category</span>
        <span className="muted" style={{ fontSize: "0.75rem" }}>this month</span>
      </div>

      <div className="bars-list" role="list">
        {data.map((category, index) => {
          const budget = budgets?.find(
            b => b.category.toLowerCase() === category.name.toLowerCase()
          );
          const isOverBudget = budget?.overBudget ?? false;

          return (
            <div
              key={category.name}
              className="bar-row"
              role="listitem"
              style={{ "--delay": `${index * 80}ms` } as React.CSSProperties}
            >
              <div className="bar-meta">
                <span className="bar-name">{category.name}</span>
                <span className={`bar-amount mono ${isOverBudget ? "loss" : ""}`}>
                  {formatINR(category.amount)}
                  {isOverBudget && (
                    <span className="over-budget-tag" title="Over budget">↑ over</span>
                  )}
                </span>
              </div>

              <div
                className="bar-track"
                role="progressbar"
                aria-valuenow={category.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${category.name}: ${category.percentage}%`}
              >
                <div
                  className={`bar-fill ${isOverBudget ? "bar-fill--over" : ""}`}
                  style={{ "--target-width": `${category.percentage}%` } as React.CSSProperties}
                />
                {budget && (
                  <div
                    className="budget-limit-line"
                    style={{
                      left: `${Math.min(100, (budget.limit / (budget.spent / (budget.percentage / 100 || 1))) * 100)}%`,
                    }}
                    title={`Budget: ${formatINR(budget.limit)}`}
                    aria-hidden="true"
                  />
                )}
              </div>

              <span className="bar-percentage label">{category.percentage}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
