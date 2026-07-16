// ============================================================
// CATEGORY BARS — Horizontal bar chart for spending breakdown
// ============================================================
//
// WHY HORIZONTAL BARS instead of a pie chart?
// The brief is explicit: "pie charts are the most 'AI dashboard
// default' chart type." But there's also a UX reason:
//
// HORIZONTAL BARS ARE BETTER FOR COMPARISON:
// - You can accurately compare lengths of horizontal bars
// - You read labels left-to-right (natural for LTR languages)
// - You can see exact percentages on a bar easier than a slice
// - Pie charts: hard to compare non-adjacent slices accurately
//   (this is a well-documented problem in data visualization research)
//
// HOW THE BARS WORK:
// Each category gets a bar whose width is its percentage of total spending.
// This is pure CSS — width: 73% for a category that's 73% of total spend.
// No SVG, no JavaScript math beyond what the server already computed.
//
// WHY NOT USE A CSS animation for the bars filling up?
// We will! A CSS transition on width creates a nice "fill" effect
// when the page loads. But we respect prefers-reduced-motion.
// ============================================================

interface CategoryBarsProps {
  data: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
  budgets?: Array<{
    category: string;
    limit: number;
    spent: number;
    percentage: number;
    overBudget: boolean;
  }>;
}

// Format as Indian Rupees (same helper as BalanceHero)
function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
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
          // Check if this category has a budget
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
              // Each bar animates in with a slight delay (staggered)
            >
              {/* Category name and amount */}
              <div className="bar-meta">
                <span className="bar-name">{category.name}</span>
                <span className={`bar-amount mono ${isOverBudget ? "loss" : ""}`}>
                  {formatINR(category.amount)}
                  {isOverBudget && (
                    <span className="over-budget-tag" title="Over budget">
                      ↑ over
                    </span>
                  )}
                </span>
              </div>
              
              {/* The bar track (background) and fill */}
              <div className="bar-track" role="progressbar" aria-valuenow={category.percentage} aria-valuemin={0} aria-valuemax={100} aria-label={`${category.name}: ${category.percentage}%`}>
                <div
                  className={`bar-fill ${isOverBudget ? "bar-fill--over" : ""}`}
                  style={{
                    // CSS animates from 0 → percentage on load
                    "--target-width": `${category.percentage}%`,
                  } as React.CSSProperties}
                />
                
                {/* Budget limit line — a vertical notch on the track */}
                {budget && (
                  <div
                    className="budget-limit-line"
                    style={{
                      // Position the notch at the budget limit percentage
                      left: `${Math.min(100, (budget.limit / (budget.spent / (budget.percentage / 100))) * 100)}%`,
                    }}
                    title={`Budget: ${formatINR(budget.limit)}`}
                    aria-hidden="true"
                  />
                )}
              </div>
              
              {/* Percentage label */}
              <span className="bar-percentage label">
                {category.percentage}%
              </span>
            </div>
          );
        })}
      </div>
      
      <style jsx>{`
        .category-bars {
          padding: var(--space-6) 0;
          border-bottom: 1px solid var(--hairline);
        }
        
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-5);
        }
        
        .bars-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }
        
        .bar-row {
          display: grid;
          grid-template-columns: 1fr auto;
          grid-template-rows: auto auto;
          gap: var(--space-1) var(--space-3);
          align-items: center;
          
          /* Staggered fade-in */
          animation: fadeIn 300ms ease both;
          animation-delay: var(--delay, 0ms);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-4px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .bar-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          grid-column: 1 / -1;
        }
        
        .bar-name {
          font-size: 0.875rem;
          color: var(--ink);
        }
        
        .bar-amount {
          font-size: 0.8125rem;
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        
        .over-budget-tag {
          font-size: 0.625rem;
          font-family: var(--font-mono);
          color: var(--loss);
          letter-spacing: 0.04em;
        }
        
        /* The gray track that holds the bar */
        .bar-track {
          position: relative;
          height: 4px;
          background: var(--hairline);
          border-radius: 2px;
          overflow: visible;
          grid-column: 1;
        }
        
        /* The colored fill */
        .bar-fill {
          height: 100%;
          background: var(--ink);
          border-radius: 2px;
          /* 
           * CSS animation: start at 0%, animate to --target-width
           * The @keyframes uses the CSS custom property we set inline
           */
          animation: fillBar 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: var(--delay, 0ms);
        }
        
        .bar-fill--over {
          background: var(--loss);
        }
        
        @keyframes fillBar {
          from { width: 0%; }
          to { width: var(--target-width); }
        }
        
        /* The budget limit notch */
        .budget-limit-line {
          position: absolute;
          top: -3px;
          width: 2px;
          height: 10px;
          background: var(--brass);
          border-radius: 1px;
        }
        
        .bar-percentage {
          font-size: 0.625rem;
          color: var(--ink-faint);
          text-align: right;
          grid-column: 2;
          grid-row: 2;
        }
        
        .categories-empty {
          padding: var(--space-6) 0;
          text-align: center;
          border-bottom: 1px solid var(--hairline);
        }
        
        /* Accessibility: disable bar animation */
        @media (prefers-reduced-motion: reduce) {
          .bar-fill {
            animation: none;
            width: var(--target-width);
          }
          .bar-row {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
