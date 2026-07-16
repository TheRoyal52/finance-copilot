// components/dashboard/BalanceHero.tsx
// Server Component — receives pre-fetched data as props, renders HTML
// No hooks, no browser APIs → stays as Server Component
// Styles live in globals.css under "BALANCE HERO" section

interface BalanceHeroProps {
  balance: number;
  monthSummary: {
    income: number;
    expenses: number;
    net: number;
    savingsRate: number;
  };
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

export default function BalanceHero({ balance, monthSummary }: BalanceHeroProps) {
  const isPositive = balance >= 0;

  return (
    <div className="balance-hero">
      <p className="label balance-label">Total Balance</p>

      <div className="balance-amount">
        <span className={`balance-number display mono ${isPositive ? "gain" : "loss"}`}>
          {isPositive ? "" : "−"}{formatINR(balance)}
        </span>
      </div>

      <div className="balance-stats">
        <div className="stat">
          <span className="label stat-label">Income</span>
          <span className="stat-value mono gain">+{formatINR(monthSummary.income)}</span>
        </div>
        <div className="stat-divider" aria-hidden="true" />
        <div className="stat">
          <span className="label stat-label">Expenses</span>
          <span className="stat-value mono loss">−{formatINR(monthSummary.expenses)}</span>
        </div>
        <div className="stat-divider" aria-hidden="true" />
        <div className="stat">
          <span className="label stat-label">Savings Rate</span>
          <span className={`stat-value mono ${monthSummary.savingsRate > 20 ? "gain" : "muted"}`}>
            {monthSummary.savingsRate}%
          </span>
        </div>
      </div>
    </div>
  );
}
