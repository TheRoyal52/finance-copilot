// app/(protected)/goals/loading.tsx
export default function GoalsLoading() {
  return (
    <div className="goals-page">
      <header className="goals-header">
        <div className="goals-header-top">
          <div>
            <div className="skeleton" style={{ width: "80px", height: "11px", marginBottom: "8px" }} />
            <div className="skeleton" style={{ width: "120px", height: "36px" }} />
          </div>
          <div className="skeleton" style={{ width: "110px", height: "36px", borderRadius: "4px" }} />
        </div>
      </header>

      <div>
        <div className="skeleton" style={{ width: "80px", height: "11px", marginBottom: "16px" }} />
        <div className="goals-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="goal-card" style={{ gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div className="skeleton" style={{ width: "130px", height: "16px" }} />
                <div className="skeleton" style={{ width: "20px", height: "20px" }} />
              </div>
              <div className="skeleton" style={{ height: "8px", borderRadius: "4px" }} />
              <div style={{ display: "flex", gap: "16px" }}>
                {[1, 2, 3].map((j) => (
                  <div key={j}>
                    <div className="skeleton" style={{ width: "40px", height: "10px", marginBottom: "4px" }} />
                    <div className="skeleton" style={{ width: "70px", height: "18px" }} />
                  </div>
                ))}
              </div>
              <div className="skeleton" style={{ height: "36px", borderRadius: "4px" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
