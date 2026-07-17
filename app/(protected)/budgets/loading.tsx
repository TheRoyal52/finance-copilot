// app/(protected)/budgets/loading.tsx
// Shows immediately when navigating to /budgets while data loads

export default function BudgetsLoading() {
  return (
    <div className="budgets-page">
      <header className="budgets-header">
        <div>
          <div className="skeleton" style={{ width: "80px", height: "11px", marginBottom: "8px" }} />
          <div className="skeleton" style={{ width: "160px", height: "36px" }} />
        </div>
      </header>

      {/* Add budget form skeleton */}
      <div className="skeleton" style={{ height: "88px", borderRadius: "6px" }} />

      {/* Budget cards skeleton */}
      <div className="budgets-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="budget-card" style={{ gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="skeleton" style={{ width: "100px", height: "16px" }} />
              <div className="skeleton" style={{ width: "20px", height: "20px", borderRadius: "4px" }} />
            </div>
            <div className="skeleton" style={{ height: "6px", borderRadius: "3px" }} />
            <div style={{ display: "flex", gap: "16px" }}>
              <div>
                <div className="skeleton" style={{ width: "40px", height: "10px", marginBottom: "4px" }} />
                <div className="skeleton" style={{ width: "70px", height: "18px" }} />
              </div>
              <div>
                <div className="skeleton" style={{ width: "30px", height: "10px", marginBottom: "4px" }} />
                <div className="skeleton" style={{ width: "80px", height: "18px" }} />
              </div>
            </div>
            <div className="skeleton" style={{ width: "70px", height: "20px", borderRadius: "3px" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
