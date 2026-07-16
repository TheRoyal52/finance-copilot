// app/(protected)/transactions/page.tsx — Server Component
import { Suspense } from "react";
import {
  getTransactions,
  getTransactionCategories,
  getTransactionSummary,
  getAllCategories,
} from "@/lib/data/transactions";
import TransactionFilters from "@/components/transactions/TransactionFilters";
import Pagination from "@/components/transactions/Pagination";
import AddTransactionDrawer from "@/components/transactions/AddTransactionDrawer";
import DeleteTransactionBtn from "@/components/transactions/DeleteTransactionBtn";

export const metadata = {
  title: "Transactions",
  description: "Complete transaction history with search and filters",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function formatINR(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-IN").format(abs);
  return amount >= 0 ? `+₹${formatted}` : `−₹${formatted}`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const filters = {
    category: typeof params.category === "string" ? params.category : undefined,
    type:     typeof params.type === "string" ? params.type : undefined,
    q:        typeof params.q === "string" ? params.q : undefined,
    page:     typeof params.page === "string" ? parseInt(params.page) : 1,
    sortBy:   typeof params.sortBy === "string" ? params.sortBy : "date",
    sortOrder:typeof params.sortOrder === "string" ? params.sortOrder : "desc",
  };

  // Parallel fetch — all 4 run simultaneously
  const [{ transactions, pagination }, categories, summary, allCategories] = await Promise.all([
    getTransactions(filters),
    getTransactionCategories(),
    getTransactionSummary(),
    getAllCategories(),
  ]);

  const categoryOptions = categories.map((c: { name: string; type: string }) => ({
    value: c.name,
    label: c.name,
  }));

  const isFiltered = filters.category || filters.type || filters.q;

  return (
    <div className="tx-page">
      {/* ── Page header ──────────────────────────────── */}
      <header className="tx-page-header">
        <div>
          <p className="label">All Transactions</p>
          <h1 className="tx-page-title display">
            {isFiltered ? "Filtered Results" : "Transaction History"}
          </h1>
        </div>

        <div className="tx-header-right">
          {/* Summary stats */}
          <div className="tx-summary-row">
            <div className="tx-summary-stat">
              <span className="label tx-summary-label">Total Entries</span>
              <span className="tx-summary-value mono">{summary.count}</span>
            </div>
            <div className="tx-summary-divider" />
            <div className="tx-summary-stat">
              <span className="label tx-summary-label">Income</span>
              <span className="tx-summary-value mono gain">
                +₹{new Intl.NumberFormat("en-IN").format(summary.income)}
              </span>
            </div>
            <div className="tx-summary-divider" />
            <div className="tx-summary-stat">
              <span className="label tx-summary-label">Spent</span>
              <span className="tx-summary-value mono loss">
                −₹{new Intl.NumberFormat("en-IN").format(summary.expenses)}
              </span>
            </div>
          </div>

          {/* Add transaction drawer trigger — Client Component */}
          <Suspense fallback={null}>
            <AddTransactionDrawer categories={allCategories} />
          </Suspense>
        </div>
      </header>

      {/* ── Filter bar ───────────────────────────────── */}
      <Suspense fallback={<div className="filter-skeleton" />}>
        <TransactionFilters categories={categoryOptions} />
      </Suspense>

      {isFiltered && (
        <p className="tx-results-count muted">
          <span className="mono">{pagination.total}</span>{" "}
          result{pagination.total !== 1 ? "s" : ""} found
        </p>
      )}

      {/* ── Transaction table ─────────────────────────── */}
      {transactions.length === 0 ? (
        <div className="tx-empty">
          <p className="tx-empty-text">— no transactions match these filters —</p>
          {!isFiltered && (
            <p className="tx-empty-hint muted">
              Add your first transaction using the button above ↑
            </p>
          )}
        </div>
      ) : (
        <table className="tx-table" role="table">
          <thead>
            <tr>
              <th scope="col" className="col-date label">Date</th>
              <th scope="col" className="col-description label">Description</th>
              <th scope="col" className="col-category label">Category</th>
              <th scope="col" className="col-type label">Type</th>
              <th scope="col" className="col-amount label">Amount</th>
              <th scope="col" className="col-actions label">
                <span className="sr-only">Actions</span>
              </th>
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
                      : <span className="muted">—</span>}
                  </td>
                  <td className="tx-type">
                    <span className={`type-pill ${isIncome ? "type-pill--income" : "type-pill--expense"}`}>
                      {isIncome ? "Income" : "Expense"}
                    </span>
                  </td>
                  <td className={`tx-amount mono ${isIncome ? "gain" : "loss"}`}>
                    {formatINR(tx.amount)}
                  </td>
                  <td className="tx-actions">
                    <DeleteTransactionBtn id={tx.id} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* ── Pagination ────────────────────────────────── */}
      <Suspense fallback={null}>
        <Pagination
          totalPages={pagination.totalPages}
          currentPage={pagination.page}
          total={pagination.total}
          limit={pagination.limit}
        />
      </Suspense>
    </div>
  );
}
