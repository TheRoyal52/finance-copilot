// app/(protected)/settings/page.tsx — Server Component

export const metadata = {
  title: "Settings",
  description: "Account and application settings",
};

const TECH_STACK = [
  { layer: "Framework",   choice: "Next.js 15 (App Router)",        reason: "Server Components, Server Actions, streaming" },
  { layer: "Database",    choice: "PostgreSQL via Neon",             reason: "Relational data + pgvector for RAG (coming)" },
  { layer: "ORM",         choice: "Prisma",                          reason: "Type-safe queries, schema-as-code, migrations" },
  { layer: "Auth",        choice: "Clerk",                           reason: "JWT + session, OAuth, no rolling your own" },
  { layer: "AI (soon)",   choice: "Vercel AI SDK + Gemini",          reason: "Streaming, tool-calling, structured outputs" },
  { layer: "RAG (soon)",  choice: "pgvector + embeddings",           reason: "Same DB, no extra service, cosine similarity" },
  { layer: "Styling",     choice: "Vanilla CSS (design tokens)",     reason: "Zero runtime overhead, full control" },
  { layer: "Deployment",  choice: "Vercel + Neon",                   reason: "Edge runtime, auto-scaling, free tier" },
];

const INTERVIEW_QUESTIONS = [
  {
    q: "Why Next.js App Router over Pages Router?",
    a: "Server Components allow data fetching directly in the component tree without prop drilling or API routes. Layouts persist across navigations. Streaming with Suspense gives instant shells while data loads.",
  },
  {
    q: "Why PostgreSQL over MongoDB for this project?",
    a: "Our data is highly relational (User → Transaction → Category → Budget). Joins are first-class. Most importantly, pgvector gives us vector similarity search in the same database — no extra service needed for RAG.",
  },
  {
    q: "Why Clerk over rolling your own auth?",
    a: "Auth is a security-critical component. Rolling your own means handling: password hashing (bcrypt cost factor), session rotation, JWT expiry, OAuth flows, CSRF, brute-force protection. Clerk handles all of this and is battle-tested at scale.",
  },
  {
    q: "What is RAG and why not just call the LLM directly?",
    a: "RAG = Retrieval-Augmented Generation. LLMs have no access to your personal transaction history. Without RAG, any financial advice is generic. With RAG: (1) embed user query, (2) find semantically similar transactions via cosine distance, (3) pass those transactions as context to the LLM → advice grounded in real data.",
  },
  {
    q: "How would you scale this to 1M users?",
    a: "Horizontal: Connection pooling (PgBouncer/Neon serverless). Caching: Redis for aggregations like monthly totals. Async: Move embedding generation to a background queue (BullMQ). Sharding: Partition Transaction table by userId. Read replicas for dashboard queries.",
  },
  {
    q: "What's the difference between Server Actions and API Routes?",
    a: "Server Actions are co-located mutations — Next.js generates the POST endpoint automatically, TypeScript types flow end-to-end, and revalidatePath() invalidates cache atomically. API Routes are better when: you need GET endpoints, external clients need to call you, or you need fine-grained HTTP control.",
  },
];

export default function SettingsPage() {
  return (
    <div className="settings-page">
      <header className="settings-header">
        <p className="label">Configuration</p>
        <h1 className="settings-title display">Settings</h1>
      </header>

      {/* Profile section — Clerk manages this */}
      <section className="settings-section">
        <h2 className="settings-section-title">Account</h2>
        <p className="muted settings-note">
          Profile, password, and connected accounts are managed by Clerk.
          Click your avatar in the sidebar to access account settings.
        </p>
        <div className="settings-clerk-hint">
          <span className="settings-clerk-icon">👤</span>
          <span>Click avatar in sidebar → Manage account</span>
        </div>
      </section>

      {/* Tech stack table — doubles as interview prep */}
      <section className="settings-section">
        <h2 className="settings-section-title">Tech Stack</h2>
        <p className="muted settings-note">
          Every choice below has a reason. Know this table — interviewers will ask.
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

      {/* Interview Q&A */}
      <section className="settings-section">
        <h2 className="settings-section-title">
          Interview Prep — 6 Questions You Will Be Asked
        </h2>
        <div className="settings-qa-list">
          {INTERVIEW_QUESTIONS.map((item, i) => (
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

      {/* Data section */}
      <section className="settings-section">
        <h2 className="settings-section-title">Data</h2>
        <p className="muted settings-note">
          Currently using seeded demo data. After integrating Clerk auth fully,
          each user will have isolated data scoped to their Clerk userId.
        </p>
        <div className="settings-data-pill">
          <span className="mono settings-data-label">DATABASE_URL</span>
          <span className="muted">postgresql://…@neon.tech/finpilot (env var)</span>
        </div>
      </section>
    </div>
  );
}
