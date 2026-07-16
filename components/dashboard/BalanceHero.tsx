// ============================================================
// BALANCE HERO — The main number. No card. Sits on the page.
// ============================================================
//
// WHY NO CARD AROUND THIS?
// The design brief says: "hero numbers get no card at all,
// they sit on the page." This is a conscious break from the
// typical AI-dashboard pattern of "everything in a rounded card."
//
// A big number with no container around it feels more like a
// financial statement — authoritative, not decorative.
//
// WHY FRAUNCES FONT FOR THE NUMBER?
// Fraunces is a slab serif — serifs with thick slabs at the ends
// instead of thin strokes. It communicates: permanence, gravity,
// a ledger that records facts. It's the typographic equivalent of
// a bank vault door. Compare to Inter or Geist — those feel
// like software, not finance.
//
// WHY IBM PLEX MONO FOR THE AMOUNT?
// Real financial software (trading terminals, bank statements,
// spreadsheets) uses monospace for numbers because:
// 1. Tabular figures: each digit is the same width, so columns align
// 2. Clear distinction from labels and descriptions
// 3. Signals "this is data, not decoration"
// ============================================================

interface BalanceHeroProps {
  balance: number;
  monthSummary: {
    income: number;
    expenses: number;
    net: number;
    savingsRate: number;
  };
}

// Format a number as Indian Rupees
// Intl.NumberFormat is the standard way — don't do manual string manipulation
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
      {/* The label above the number */}
      <p className="label balance-label">Total Balance</p>
      
      {/* The number itself — no card, just typography on the background */}
      <div className="balance-amount">
        <span className={`balance-number display mono ${isPositive ? "gain" : "loss"}`}>
          {isPositive ? "" : "−"}{formatINR(balance)}
        </span>
      </div>
      
      {/* Month summary stats — three small numbers below the hero */}
      <div className="balance-stats">
        <div className="stat">
          <span className="label stat-label">Income</span>
          <span className="stat-value mono gain">+{formatINR(monthSummary.income)}</span>
        </div>
        
        {/* Thin vertical divider */}
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
      
      <style jsx>{`
        .balance-hero {
          padding-bottom: var(--space-8);
          border-bottom: 1px solid var(--hairline);
        }
        
        .balance-label {
          margin-bottom: var(--space-2);
        }
        
        .balance-amount {
          line-height: 1;
          margin-bottom: var(--space-5);
        }
        
        /* 
         * The big number. 
         * 3.5rem ≈ 56px on desktop — big enough to anchor the page,
         * small enough not to feel like a landing-page hero.
         */
        .balance-number {
          font-size: clamp(2.25rem, 5vw, 3.5rem);
          font-weight: 600;
          letter-spacing: -0.02em;
        }
        
        .balance-stats {
          display: flex;
          align-items: center;
          gap: var(--space-5);
        }
        
        .stat {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        
        .stat-label {
          font-size: 0.625rem;
        }
        
        .stat-value {
          font-size: 0.875rem;
        }
        
        .stat-divider {
          width: 1px;
          height: 28px;
          background: var(--hairline);
        }
      `}</style>
    </div>
  );
}
