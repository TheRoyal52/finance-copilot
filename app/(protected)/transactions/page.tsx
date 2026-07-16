// app/(protected)/transactions/page.tsx
// ============================================================
// TRANSACTIONS PAGE — Server Component
// ============================================================
//
// SEARCHPARAMS IN SERVER COMPONENTS:
// In Next.js App Router, page.tsx automatically receives
// `searchParams` as a prop — the parsed URL query string.
// So /transactions?category=Food&page=2 gives us:
//   searchParams = { category: "Food", page: "2" }
//
// This is the "server reads URL, client updates URL" pattern:
// - Server reads searchParams → fetches filtered data
// - Client updates URL via router.push() → triggers re-render
// - No useState, no useEffect, no API route needed!
//
// WHY THIS IS BETTER THAN A USEEFFECT + FETCH PATTERN:
// Traditional: client renders → useEffect fires → fetch('/api/...') →
//              set state → re-render (waterfall, slower)
// Our pattern: URL changes → Server Component runs → data is in HTML
//              when the page arrives (faster, no flicker)
// ============================================================

import { Suspense } from "react";
import {
  getTransactions,
  getTransactionCategories,
  getTransactionSummary,
} from "@/lib/data/transactions";
import TransactionFilters from "@/components/transactions/TransactionFilters";
import Pagination from "@/components/transactions/Pagination";

export const metadata = {
  title: "Transactions",
  description: "Complete transaction history with search and filters",
};

// WHY `searchParams` IS A PROMISE IN NEXT.JS 15:
// Next.js 15 made searchParams async to support streaming.
// We await it before use.
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
  // Await searchParams (Next.js 15 requirement)
  const params = await searchParams;

  // Parse URL params into typed filters
  const filters = {
    category: typeof params.category === "string" ? params.category : undefined,
    type:     typeof params.type === "string" ? params.type : undefined,
    q:        typeof params.q === "string" ? params.q : undefined,
    page:     typeof params.page === "string" ? parseInt(params.page) : 1,
    sortBy:   typeof params.sortBy === "string" ? params.sortBy : "date",
    sortOrder:typeof params.sortOrder === "string" ? params.sortOrder : "desc",
  };

  // Fetch everything in parallel
  const [{ transactions, pagination }, categories, summary] = await Promise.all([
    getTransactions(filters),
    getTransactionCategories(),
    getTransactionSummary(),
  ]);

  // Format categories for the dropdown
  const categoryOptions = categories.map((c: { name: string; type: string }) => ({
    value: c.name,
    label: c.name,
  }));

  const isFiltered = filters.category || filters.type || filters.q;

  return (
    <div className="tx-page">
      {/* Page header */}
      <header className="tx-page-header">
        <div>
          <p className="label">All Transactions</p>
          <h1 className="tx-page-title display">
            {isFiltered ? "Filtered Results" : "Transaction History"}
          </h1>
        </div>

        {/* Summary stats row */}
        <div className="tx-summary-row">
          <div className="tx-summary-stat">
            <span className="label tx-summary-label">Total Entries</span>
            <span className="tx-summary-value mono">{summary.count}</span>
          </div>
          <div className="tx-summary-divider" />
          <div className="tx-summary-stat">
            <span className="label tx-summary-label">Total Income</span>
            <span className="tx-summary-value mono gain">+₹{new Intl.NumberFormat("en-IN").format(summary.income)}</span>
          </div>
          <div className="tx-summary-divider" />
          <div className="tx-summary-stat">
            <span className="label tx-summary-label">Total Spent</span>
            <span className="tx-summary-value mono loss">−₹{new Intl.NumberFormat("en-IN").format(summary.expenses)}</span>
          </div>
        </div>
      </header>

      {/* Filters — Client Component wrapped in Suspense
       *
       * WHY SUSPENSE HERE?
       * TransactionFilters uses useSearchParams() which requires
       * the Suspense boundary in Next.js App Router. Without it,
       * Next.js can't prerender the page during build time because
       * searchParams is dynamic. Suspense tells Next.js:
       * "render this part dynamically when needed."
       */}
      <Suspense fallback={<div className="filter-skeleton" />}>
        <TransactionFilters categories={categoryOptions} />
      </Suspense>

      {/* Results count when filtered */}
      {isFiltered && (
        <p className="tx-results-count muted">
          <span className="mono">{pagination.total}</span> result{pagination.total !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Transaction table */}
      {transactions.length === 0 ? (
        <div className="tx-empty">
          <p className="tx-empty-text">— no transactions match these filters —</p>
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
                    {tx.category ? (
                      <span className="category-badge">{tx.category.name}</span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="tx-type">
                    <span className={`type-pill ${isIncome ? "type-pill--income" : "type-pill--expense"}`}>
                      {isIncome ? "Income" : "Expense"}
                    </span>
                  </td>
                  <td className={`tx-amount mono ${isIncome ? "gain" : "loss"}`}>
                    {formatINR(tx.amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Pagination */}
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
