"use client";
// components/transactions/TransactionFilters.tsx
// ============================================================
// CLIENT COMPONENT — handles filter state via URL search params
// ============================================================
//
// THE KEY PATTERN: useSearchParams + useRouter
//
// Instead of: useState({ category: "", q: "" })
// We use:     URL = /transactions?category=Food&q=zomato
//
// When user types in search box → we update the URL
// → Next.js re-renders the Server Component page.tsx
// → page.tsx reads new URL params → fetches new data
// → New results appear WITHOUT a full page reload
//
// This is called "URL as state" — it's more robust than useState
// because the URL persists across refreshes and can be shared.
//
// HOW useTransition WORKS:
// When we update the URL, Next.js starts fetching new data.
// During this fetch, the UI could freeze or show a blank state.
// useTransition marks the update as "non-urgent" — React keeps
// showing the current UI while the new data loads in background.
// isPending tells us if a transition is in progress → we show
// a subtle loading indicator.
// ============================================================

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTransition, useCallback } from "react";

interface FilterOption {
  value: string;
  label: string;
}

interface TransactionFiltersProps {
  categories: FilterOption[];
}

export default function TransactionFilters({ categories }: TransactionFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Read current filter values from URL
  const currentQ = searchParams.get("q") ?? "";
  const currentCategory = searchParams.get("category") ?? "";
  const currentType = searchParams.get("type") ?? "";

  // Helper: update a single search param, reset page to 1
  const updateParam = useCallback(
    (key: string, value: string) => {
      // Build a new URLSearchParams from the current ones
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      // Always reset to page 1 when filters change
      // (otherwise you might be on page 5 with 0 results)
      params.delete("page");

      // startTransition: marks this navigation as non-urgent
      // React keeps showing old UI while new data loads
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, pathname, router]
  );

  return (
    <div className={`tx-filters ${isPending ? "tx-filters--loading" : ""}`}>
      {/* Search box */}
      <div className="filter-search">
        <span className="filter-search-icon" aria-hidden="true">⌕</span>
        <input
          type="search"
          id="tx-search"
          placeholder="Search transactions…"
          defaultValue={currentQ}
          className="filter-input"
          aria-label="Search transactions by description"
          onChange={(e) => updateParam("q", e.target.value)}
        />
        {isPending && (
          <span className="filter-loading" aria-label="Loading results…">○</span>
        )}
      </div>

      {/* Category dropdown */}
      <select
        id="tx-category-filter"
        className="filter-select"
        value={currentCategory}
        aria-label="Filter by category"
        onChange={(e) => updateParam("category", e.target.value)}
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat.value} value={cat.value}>
            {cat.label}
          </option>
        ))}
      </select>

      {/* Income / Expense toggle */}
      <div className="filter-type-group" role="group" aria-label="Transaction type">
        {[
          { value: "",        label: "All" },
          { value: "INCOME",  label: "Income" },
          { value: "EXPENSE", label: "Expense" },
        ].map((opt) => (
          <button
            key={opt.value}
            className={`filter-type-btn ${currentType === opt.value ? "filter-type-btn--active" : ""}`}
            onClick={() => updateParam("type", opt.value)}
            aria-pressed={currentType === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Clear all filters — only show if any filter is active */}
      {(currentQ || currentCategory || currentType) && (
        <button
          className="filter-clear"
          onClick={() => {
            startTransition(() => router.push(pathname));
          }}
          aria-label="Clear all filters"
        >
          × Clear
        </button>
      )}
    </div>
  );
}
