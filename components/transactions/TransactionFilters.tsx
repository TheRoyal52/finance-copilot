"use client";
// components/transactions/TransactionFilters.tsx
// SEARCH DEBOUNCE ADDED: waits 300ms after user stops typing before updating URL
// WHY DEBOUNCE?
// Without it: every keystroke = URL update = server re-render = DB query
// "Netflix" = 7 keystrokes = 7 DB queries, 7 navigations
// With 300ms debounce: user types "Netflix", pauses → 1 DB query
// This is a classic performance pattern used in every search UI.

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTransition, useCallback, useRef, useState, useEffect } from "react";

interface FilterOption {
  value: string;
  label: string;
}

export default function TransactionFilters({ categories }: { categories: FilterOption[] }) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state for the search input value (shows instantly while URL update is debounced)
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync searchValue if URL changes externally (e.g., "Clear" button)
  useEffect(() => {
    setSearchValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  const currentCategory = searchParams.get("category") ?? "";
  const currentType     = searchParams.get("type") ?? "";

  // Helper: push URL update (used for dropdowns — instant, no debounce)
  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) { params.set(key, value); } else { params.delete(key); }
      params.delete("page");
      startTransition(() => { router.push(`${pathname}?${params.toString()}`); });
    },
    [searchParams, pathname, router]
  );

  // Debounced search: update local state immediately, delay URL push by 300ms
  function handleSearchChange(value: string) {
    setSearchValue(value); // instant UI update

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) { params.set("q", value); } else { params.delete("q"); }
      params.delete("page");
      startTransition(() => { router.push(`${pathname}?${params.toString()}`); });
    }, 300); // 300ms — sweet spot: responsive but not spammy
  }

  const isFiltered = searchValue || currentCategory || currentType;

  return (
    <div className={`tx-filters ${isPending ? "tx-filters--loading" : ""}`}>
      {/* Search box */}
      <div className="filter-search">
        <span className="filter-search-icon" aria-hidden="true">⌕</span>
        <input
          type="search"
          id="tx-search"
          placeholder="Search transactions…"
          value={searchValue}
          className="filter-input"
          aria-label="Search transactions by description"
          onChange={(e) => handleSearchChange(e.target.value)}
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
          <option key={cat.value} value={cat.value}>{cat.label}</option>
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

      {isFiltered && (
        <button
          className="filter-clear"
          onClick={() => {
            setSearchValue("");
            if (debounceRef.current) clearTimeout(debounceRef.current);
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
