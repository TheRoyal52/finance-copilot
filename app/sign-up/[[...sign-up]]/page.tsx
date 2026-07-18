// app/sign-up/[[...sign-up]]/page.tsx
// Branded sign-up page — same two-panel layout as sign-in

import { SignUp } from "@clerk/nextjs";

export const metadata = {
  title: "Sign Up — Finpilot",
  description: "Create your Finpilot account — AI-powered personal finance",
};

export default function SignUpPage() {
  return (
    <div className="auth-page">
      {/* Left panel — brand story */}
      <div className="auth-brand">
        <div className="auth-brand-content">
          <div className="auth-logo">
            <span className="auth-logo-mark">⬡</span>
            <span className="auth-logo-name">Finpilot</span>
          </div>

          <div className="auth-headline">
            <h1 className="auth-headline-text">
              Your money,<br />finally explained.
            </h1>
            <p className="auth-subtext">
              Finpilot tracks every rupee and explains the patterns — using RAG-powered AI that reads your actual transaction history, not generic templates.
            </p>
          </div>

          <ul className="auth-features">
            {[
              ["▸", "AI copilot trained on your real transactions"],
              ["▸", "Budget alerts before you overspend, not after"],
              ["▸", "Savings goals with automatic daily tracking"],
              ["▸", "Semantic search — find any expense instantly"],
            ].map(([icon, text]) => (
              <li key={text} className="auth-feature-item">
                <span className="auth-feature-icon">{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>

          {/* Stats teaser */}
          <div className="auth-ledger-preview" aria-hidden="true">
            <div className="auth-ledger-row auth-ledger-row--ai">
              <span className="auth-ledger-time mono">Now</span>
              <span className="auth-ledger-desc">AI: Your savings rate is 22% — above average</span>
              <span className="auth-ledger-amount mono" style={{ color: "var(--brass)" }}>✦</span>
            </div>
            <div className="auth-ledger-row">
              <span className="auth-ledger-time mono">Jul</span>
              <span className="auth-ledger-desc">Food & Dining — on budget</span>
              <span className="auth-ledger-amount mono gain">✓</span>
            </div>
            <div className="auth-ledger-row">
              <span className="auth-ledger-time mono">Jul</span>
              <span className="auth-ledger-desc">Transport — ₹980 over budget</span>
              <span className="auth-ledger-amount mono loss">⚠</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — Clerk sign-up widget */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <p className="auth-welcome label">Create your account</p>
          <SignUp
            appearance={{
              elements: {
                rootBox: "clerk-root",
                card: "clerk-card",
                headerTitle: "clerk-header-title",
                headerSubtitle: "clerk-header-subtitle",
                socialButtonsBlockButton: "clerk-social-btn",
                formFieldLabel: "clerk-field-label",
                formFieldInput: "clerk-field-input",
                formButtonPrimary: "clerk-submit-btn",
                footerActionLink: "clerk-footer-link",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
