// app/(protected)/settings/page.tsx — Server Component
// currentUser() is a Clerk server helper — reads the session JWT from the request
// and returns the authenticated user object. No DB call needed.
// WHY no DB call? Clerk caches the user in the session token (a signed JWT).
// The token is verified locally — no network round-trip to Clerk's servers on every request.

import { currentUser } from "@clerk/nextjs/server";
import ClerkProfileModal from "@/components/settings/ClerkProfileModal";

export const metadata = {
  title: "Settings — Finpilot",
  description: "Account and application settings",
};

const TECH_STACK = [
  { layer: "Framework",  choice: "Next.js 16 (App Router)",    reason: "Server Components, Server Actions, streaming — no API boilerplate" },
  { layer: "Database",   choice: "PostgreSQL via Neon",         reason: "Relational + pgvector for RAG — same DB, no extra service" },
  { layer: "ORM",        choice: "Prisma",                      reason: "Type-safe queries, schema-as-code, auto migrations" },
  { layer: "Auth",       choice: "Clerk",                       reason: "JWT + session, OAuth, no rolling your own auth" },
  { layer: "AI",         choice: "Vercel AI SDK + Gemini 3.5",  reason: "Streaming responses, RAG pipeline, gemini-embedding-2 for vectors" },
  { layer: "RAG",        choice: "pgvector + embeddings",        reason: "Semantic search in the same Postgres — cosine similarity, no Pinecone needed" },
  { layer: "Styling",    choice: "Vanilla CSS (design tokens)", reason: "Zero runtime overhead, full control, no class soup" },
  { layer: "Deploy",     choice: "Vercel + Neon",               reason: "Edge runtime, auto-scaling, both have free tiers" },
];

const INTERVIEW_QA = [
  {
    q: "Why Next.js App Router over Pages Router?",
    a: "Server Components allow data fetching directly in the component tree — no prop drilling, no separate API routes for reads. Layouts persist across navigations (sidebar doesn't re-mount). Streaming with Suspense gives instant UI shells while data loads, eliminating blank screens.",
  },
  {
    q: "Why PostgreSQL over MongoDB for a finance app?",
    a: "Finance data is highly relational: User → Transaction → Category → Budget. Joins are first-class. More importantly, pgvector gives vector similarity search inside the same database — no extra service (Pinecone, Weaviate) needed for our RAG pipeline. One DB = one connection pool = simpler ops.",
  },
  {
    q: "Why Clerk instead of rolling your own auth?",
    a: "Auth is a security-critical component. Rolling your own means handling: bcrypt cost factors, session rotation, JWT expiry strategy, OAuth PKCE flow, CSRF tokens, brute-force rate limiting, MFA. Clerk handles all of this, is battle-tested at scale, and lets us focus on the product.",
  },
  {
    q: "What is RAG and why not just call the LLM directly?",
    a: "RAG = Retrieval-Augmented Generation. LLMs have no access to your personal data. Without RAG, any advice is generic. With RAG: (1) embed the user's query into a vector, (2) find semantically similar transactions via cosine distance in pgvector, (3) inject those as context into the LLM prompt. Result: advice grounded in YOUR actual transactions.",
  },
  {
    q: "How would you scale Finpilot to 1M users?",
    a: "Connection pooling via PgBouncer or Neon serverless. Redis for aggregation cache (monthly totals). Move embedding generation to a background queue (BullMQ/Inngest) so addTransaction stays fast. Partition the Transaction table by userId. Read replicas for dashboard queries. CDN edge caching for static assets.",
  },
  {
    q: "Server Actions vs API Routes — when to use which?",
    a: "Server Actions for mutations: auto-generated POST endpoint, TypeScript types flow end-to-end, revalidatePath() atomically invalidates cache. API Routes for: GET endpoints that external clients call, fine-grained HTTP control (custom headers, streaming), or when you need a public REST/GraphQL interface. We use both: Actions for CRUD, Routes for /api/chat (AI streaming).",
  },
];

export default async function SettingsPage() {
  const user = await currentUser();

  const displayName  = user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress || "User";
  const email        = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const avatarUrl    = user?.imageUrl ?? null;
  const joinedDate   = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="settings-page">

      {/* ── Header ─────────────────────────────────── */}
      <header className="settings-header">
        <p className="label">Configuration</p>
        <h1 className="settings-title display">Settings</h1>
      </header>

      {/* ── Profile — pulled from Clerk session ────── */}
      <section className="settings-section">
        <h2 className="settings-section-title">Profile</h2>
        <div className="settings-profile">
          {avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={avatarUrl} alt={displayName} className="settings-avatar" />
          ) : (
            <div className="settings-avatar-placeholder">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="settings-profile-info">
            <p className="settings-profile-name">{displayName}</p>
            {email && <p className="settings-profile-email muted">{email}</p>}
            {joinedDate && (
              <p className="settings-profile-joined label">Member since {joinedDate}</p>
            )}
          </div>
        </div>

        {/* Clerk UserProfile modal — Client Component */}
        <div className="settings-managed-note">
          <span className="settings-managed-icon">🔒</span>
          <div>
            <p className="settings-managed-title">Secured by Clerk</p>
            <p className="muted" style={{ fontSize: "0.8125rem", marginBottom: "var(--space-3)" }}>
              Password, connected accounts, and multi-factor authentication are managed securely via Clerk.
            </p>
            {/* This Client Component opens the embedded Clerk UserProfile in a modal */}
            <ClerkProfileModal />
          </div>
        </div>
      </section>

      {/* ── Data & Privacy ──────────────────────────── */}
      <section className="settings-section">
        <h2 className="settings-section-title">Data &amp; Privacy</h2>
        <div className="settings-data-row">
          <div className="settings-data-item">
            <p className="label" style={{ fontSize: "0.6875rem", marginBottom: "4px" }}>Database</p>
            <p className="mono settings-data-val">PostgreSQL via Neon (serverless)</p>
          </div>
          <div className="settings-data-item">
            <p className="label" style={{ fontSize: "0.6875rem", marginBottom: "4px" }}>Data Isolation</p>
            <p className="mono settings-data-val">Scoped to your Clerk userId</p>
          </div>
          <div className="settings-data-item">
            <p className="label" style={{ fontSize: "0.6875rem", marginBottom: "4px" }}>Encryption</p>
            <p className="mono settings-data-val">TLS in transit, AES-256 at rest</p>
          </div>
          <div className="settings-data-item">
            <p className="label" style={{ fontSize: "0.6875rem", marginBottom: "4px" }}>AI Context</p>
            <p className="mono settings-data-val">Transaction embeddings stored in pgvector</p>
          </div>
        </div>
      </section>

      {/* ── Tech stack table ────────────────────────── */}
      <section className="settings-section">
        <h2 className="settings-section-title">Tech Stack</h2>
        <p className="muted" style={{ fontSize: "0.875rem" }}>
          Every choice has a reason. Know this table — interviewers will ask.
        </p>
        <table className="settings-table">
          <thead>
            <tr>
              <th className="label">Layer</th>
              <th className="label">Choice</th>
              <th className="label">Why</th>
            </tr>
          </thead>
          <tbody>
            {TECH_STACK.map((row) => (
              <tr key={row.layer}>
                <td className="settings-layer mono">{row.layer}</td>
                <td className="settings-choice">{row.choice}</td>
                <td className="settings-reason muted">{row.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Interview Q&A ───────────────────────────── */}
      <section className="settings-section">
        <h2 className="settings-section-title">Interview Prep — 6 Questions You Will Be Asked</h2>
        <p className="muted" style={{ fontSize: "0.875rem", marginBottom: "var(--space-2)" }}>
          Click any question to reveal the model answer.
        </p>
        <div className="settings-qa-list">
          {INTERVIEW_QA.map((item, i) => (
            <details key={i} className="settings-qa-item">
              <summary className="settings-qa-q">
                <span className="settings-qa-num mono">{String(i + 1).padStart(2, "0")}</span>
                {item.q}
              </summary>
              <p className="settings-qa-a muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
