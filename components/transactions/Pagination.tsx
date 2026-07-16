"use client";
// components/transactions/Pagination.tsx
// Client Component — updates the ?page= URL param

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  total: number;
  limit: number;
}

export default function Pagination({ totalPages, currentPage, total, limit }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  if (totalPages <= 1) return null;

  // Calculate what entries we're showing: "Showing 21–40 of 63"
  const from = (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, total);

  return (
    <div className="pagination">
      <span className="pagination-info muted">
        Showing <span className="mono">{from}–{to}</span> of{" "}
        <span className="mono">{total}</span>
      </span>

      <div className="pagination-controls">
        <button
          className="page-btn"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1 || isPending}
          aria-label="Previous page"
        >
          ←
        </button>

        {/* Show page numbers with ellipsis for large page counts */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) =>
            p === 1 ||
            p === totalPages ||
            Math.abs(p - currentPage) <= 1
          )
          .reduce<(number | "…")[]>((acc, p, idx, arr) => {
            if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
            acc.push(p);
            return acc;
          }, [])
          .map((p, idx) =>
            p === "…" ? (
              <span key={`ellipsis-${idx}`} className="page-ellipsis muted">…</span>
            ) : (
              <button
                key={p}
                className={`page-btn ${p === currentPage ? "page-btn--active" : ""}`}
                onClick={() => goToPage(p as number)}
                disabled={isPending}
                aria-label={`Page ${p}`}
                aria-current={p === currentPage ? "page" : undefined}
              >
                {p}
              </button>
            )
          )}

        <button
          className="page-btn"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages || isPending}
          aria-label="Next page"
        >
          →
        </button>
      </div>
    </div>
  );
}
