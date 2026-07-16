// ============================================================
// TRANSACTION TABLE — Dense, tabular, financial
// ============================================================
//
// WHAT MAKES THIS DIFFERENT FROM A "DEFAULT" TABLE:
//
// 1. NO ZEBRA STRIPING — alternating row colors look dated and add
//    visual noise. We use a single hairline border under each row.
//
// 2. NO ROUNDED CARD WRAPPER — the table sits directly on the page,
//    like a ledger page, not a widget in a card.
//
// 3. IBM PLEX MONO FOR AMOUNTS — right-aligned in their column.
//    This is the "tabular figures" principle: digits align vertically,
//    so you can scan down a column and compare amounts at a glance.
//    Every serious financial product does this. Most dashboards don't.
//
// 4. AMOUNTS ARE SIGNED — +75,000 and -450 instead of green/red dots.
//    The sign IS the information. Don't make users decode colors alone.
//
// 5. DATES SHOWN IN A COMPACT FORMAT — "16 Jul" not "July 16, 2026"
//    This is a dense table — every character costs space.
// ============================================================

// TypeScript interface — describes the shape of each transaction object
// This is what Prisma returns from getRecentTransactions()
interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: Date;
  category: {
    name: string;
    type: string;
  } | null;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

// Format currency for the table (compact, no currency symbol in column)
// We use ₹ symbol + number with commas
function formatAmount(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-IN").format(abs);
  return amount >= 0 ? `+₹${formatted}` : `−₹${formatted}`;
}

// Format date compactly: "16 Jul"
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function TransactionTable({ transactions }: TransactionTableProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="table-empty">
        <p className="table-empty-text">— no entries this week —</p>
      </div>
    );
  }
  
  return (
    <div className="transaction-section">
      <div className="section-header">
        <span className="label">Recent Transactions</span>
        <a href="/transactions" className="view-all-link muted">
          View all →
        </a>
      </div>
      
      {/* 
       * <table> is the correct HTML element for tabular data.
       * It gives screen readers column/row context automatically.
       * Don't use div-tables for actual data — use <table>.
       */}
      <table className="tx-table" role="table">
        <thead>
          <tr>
            <th scope="col" className="col-date label">Date</th>
            <th scope="col" className="col-description label">Description</th>
            <th scope="col" className="col-category label">Category</th>
            <th scope="col" className="col-amount label">Amount</th>
          </tr>
        </thead>
        
        <tbody>
          {transactions.map((tx) => {
            const isIncome = tx.amount > 0;
            
            return (
              <tr key={tx.id} className="tx-row">
                {/* Date */}
                <td className="tx-date mono">
                  {formatDate(tx.date)}
                </td>
                
                {/* Description — truncate if too long */}
                <td className="tx-description" title={tx.description}>
                  {tx.description}
                </td>
                
                {/* Category badge */}
                <td className="tx-category">
                  {tx.category ? (
                    <span className="category-badge">
                      {tx.category.name}
                    </span>
                  ) : (
                    <span className="category-none muted">—</span>
                  )}
                </td>
                
                {/* 
                 * Amount — monospace, right-aligned, colored
                 * The sign (+/-) is explicit in the text, not just color,
                 * so colorblind users get the same information.
                 */}
                <td className={`tx-amount mono ${isIncome ? "gain" : "loss"}`}>
                  {formatAmount(tx.amount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      <style jsx>{`
        .transaction-section {
          padding-top: var(--space-6);
        }
        
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-4);
        }
        
        .view-all-link {
          font-size: 0.8125rem;
          transition: color var(--transition-fast);
        }
        
        .view-all-link:hover {
          color: var(--brass);
        }
        
        /* 
         * The table itself — no card wrapper, no box shadow
         * It sits directly on the --paper background
         * Full width, with collapsed borders
         */
        .tx-table {
          width: 100%;
          border-collapse: collapse;
          /* 
           * table-layout: fixed means column widths are set by the header,
           * not the content. This prevents columns from jumping around.
           */
          table-layout: fixed;
        }
        
        /* Header cells */
        th {
          text-align: left;
          padding: var(--space-2) var(--space-2) var(--space-2) 0;
          border-bottom: 1px solid var(--hairline);
          font-size: 0.625rem;
          color: var(--ink-muted);
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        
        /* Amount column header — right aligned */
        th.col-amount {
          text-align: right;
        }
        
        /* Column widths */
        .col-date        { width: 60px; }
        .col-description { width: auto; }
        .col-category    { width: 120px; }
        .col-amount      { width: 110px; }
        
        /* Row styles */
        .tx-row {
          border-bottom: 1px solid var(--hairline);
          /* No zebra striping. Just this single hairline. */
        }
        
        .tx-row:last-child {
          border-bottom: none;
        }
        
        /* Hover state — subtle, not jarring */
        .tx-row:hover {
          background: var(--paper-subtle);
        }
        
        /* All cells */
        td {
          padding: var(--space-3) var(--space-2) var(--space-3) 0;
          font-size: 0.875rem;
          vertical-align: middle;
        }
        
        .tx-date {
          font-size: 0.8125rem;
          color: var(--ink-muted);
        }
        
        .tx-description {
          /* Truncate long descriptions with ellipsis */
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding-right: var(--space-3);
        }
        
        .tx-category {
          padding-right: var(--space-3);
        }
        
        .category-badge {
          font-size: 0.6875rem;
          padding: 2px 6px;
          background: var(--paper-subtle);
          border-radius: 2px;
          color: var(--ink-muted);
          white-space: nowrap;
        }
        
        /* 
         * Amount — right-aligned, monospace
         * Right-align numbers in financial tables so the digits
         * stack vertically for easy comparison down the column
         */
        .tx-amount {
          text-align: right;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .table-empty {
          padding: var(--space-10) 0;
          text-align: center;
        }
        
        .table-empty-text {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--ink-faint);
          letter-spacing: 0.04em;
        }
      `}</style>
    </div>
  );
}
