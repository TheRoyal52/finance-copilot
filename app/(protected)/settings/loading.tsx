// app/(protected)/settings/loading.tsx
export default function SettingsLoading() {
  return (
    <div className="settings-page">
      <header className="settings-header">
        <div className="skeleton" style={{ width: "80px", height: "11px", marginBottom: "8px" }} />
        <div className="skeleton" style={{ width: "150px", height: "36px" }} />
      </header>

      {/* Profile skeleton */}
      <div className="settings-section">
        <div className="skeleton" style={{ width: "60px", height: "13px", marginBottom: "16px" }} />
        <div className="settings-profile">
          <div className="skeleton" style={{ width: "56px", height: "56px", borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
            <div className="skeleton" style={{ width: "140px", height: "17px" }} />
            <div className="skeleton" style={{ width: "200px", height: "14px" }} />
            <div className="skeleton" style={{ width: "120px", height: "11px" }} />
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="settings-section">
        <div className="skeleton" style={{ width: "90px", height: "13px", marginBottom: "16px" }} />
        {[1,2,3,4,5].map((i) => (
          <div key={i} style={{ display: "flex", gap: "24px", padding: "12px 0", borderBottom: "1px solid var(--hairline)" }}>
            <div className="skeleton" style={{ width: "80px", height: "13px" }} />
            <div className="skeleton" style={{ width: "150px", height: "13px" }} />
            <div className="skeleton" style={{ flex: 1, height: "13px" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
