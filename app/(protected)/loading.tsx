// app/(protected)/loading.tsx
// ============================================================
// NEXT.JS LOADING UI — Instant skeleton while server fetches data
// ============================================================
//
// HOW THIS WORKS (important interview concept!):
//
// Without loading.tsx:
//   User clicks "Transactions" → browser waits 2-3s → page appears
//   During that wait: nothing shown = bad UX
//
// With loading.tsx:
//   User clicks "Transactions" → loading.tsx renders INSTANTLY
//   (it has no async, no DB calls, so it shows in <100ms)
//   Meanwhile, page.tsx fetches data in the background
//   When data is ready, Next.js swaps loading.tsx → page.tsx
//
// This is called "Streaming" in Next.js — the shell comes first,
// content streams in after. React Suspense powers this.
//
// WHY SKELETONS BEAT SPINNERS:
// A spinner says "loading..." — anxiety, no sense of layout
// A skeleton shows the SHAPE of what's coming — feels faster
// because your brain pre-maps where content will appear
// ============================================================

export default function DashboardLoading() {
  return (
    <div className="skeleton-page">
      {/* Page header skeleton */}
      <div className="skeleton-header">
        <div className="skeleton-line skeleton-label" />
        <div className="skeleton-line skeleton-title" />
      </div>

      {/* Stats row skeleton */}
      <div className="skeleton-stats">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-stat-card">
            <div className="skeleton-line skeleton-stat-label" />
            <div className="skeleton-line skeleton-stat-value" />
          </div>
        ))}
      </div>

      {/* Content area skeleton — rows */}
      <div className="skeleton-rows">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton-row" style={{ opacity: 1 - i * 0.08 }}>
            <div className="skeleton-line" style={{ width: "80px" }} />
            <div className="skeleton-line" style={{ flex: 1 }} />
            <div className="skeleton-line" style={{ width: "100px" }} />
            <div className="skeleton-line" style={{ width: "80px" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
