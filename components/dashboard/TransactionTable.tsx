// components/dashboard/TransactionTable.tsx
// Server Component — no hooks. Styles in globals.css

interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: Date;
  category: { name: string; type: string; } | null;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

function formatAmount(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-IN").format(abs);
  return amount >= 0 ? `+₹${formatted}` : `−₹${formatted}`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric", month: "short",
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
        <a href="/transactions" className="view-all-link muted">View all →</a>
      </div>

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
                <td className="tx-date mono">{formatDate(tx.date)}</td>
                <td className="tx-description" title={tx.description}>
                  {tx.description}
                </td>
                <td className="tx-category">
                  {tx.category
                    ? <span className="category-badge">{tx.category.name}</span>
                    : <span className="muted">—</span>
                  }
                </td>
                <td className={`tx-amount mono ${isIncome ? "gain" : "loss"}`}>
                  {formatAmount(tx.amount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
