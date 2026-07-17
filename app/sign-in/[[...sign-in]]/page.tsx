// app/sign-in/[[...sign-in]]/page.tsx
// Custom Clerk sign-in page — branded with Finpilot identity
// The [[...sign-in]] catch-all is required by Clerk for its multi-step flows
// (email → OTP, OAuth callbacks, etc.)

import { SignIn } from "@clerk/nextjs";

export const metadata = {
  title: "Sign In — Finpilot",
  description: "Sign in to your Finpilot account",
};

export default function SignInPage() {
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
              A ledger<br />that talks back.
            </h1>
            <p className="auth-subtext">
              Your AI copilot writes its reasoning directly into your ledger,
              as timestamped entries — because transparency over your money
              beats a mysterious black box.
            </p>
          </div>

          <ul className="auth-features">
            {[
              ["▸", "Track income, expenses, and budgets"],
              ["▸", "Set savings goals with daily targets"],
              ["▸", "AI insights grounded in your real data"],
              ["▸", "Recurring payment auto-detection"],
            ].map(([icon, text]) => (
              <li key={text} className="auth-feature-item">
                <span className="auth-feature-icon">{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <div className="auth-ledger-preview" aria-hidden="true">
            <div className="auth-ledger-row auth-ledger-row--ai">
              <span className="auth-ledger-time mono">09:41</span>
              <span className="auth-ledger-desc">AI: Food spending up 23% this month</span>
              <span className="auth-ledger-amount mono loss">↑</span>
            </div>
            <div className="auth-ledger-row">
              <span className="auth-ledger-time mono">09:30</span>
              <span className="auth-ledger-desc">Zomato order</span>
              <span className="auth-ledger-amount mono loss">−₹340</span>
            </div>
            <div className="auth-ledger-row">
              <span className="auth-ledger-time mono">09:00</span>
              <span className="auth-ledger-desc">Salary credit</span>
              <span className="auth-ledger-amount mono gain">+₹85,000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — Clerk sign-in widget */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <p className="auth-welcome label">Welcome back</p>
          <SignIn
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
