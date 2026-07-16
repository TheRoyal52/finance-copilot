"use client";
// ============================================================
// THE LEDGER TRAIL — Signature Design Element
// ============================================================
//
// WHAT IS THIS?
// Instead of a floating chat bubble (❌ the AI cliché), we show
// the AI's reasoning as timestamped log entries in the right rail.
// This is always visible — not a popup, not an overlay.
//
// WHY THIS DESIGN MATTERS (interview answer):
// "The trust problem in AI-finance isn't accuracy alone — it's
// transparency. When an AI says 'you're overspending on food',
// a user naturally wants to know HOW it knows that. The Ledger
// Trail shows every tool call the agent makes, in real time, in
// the same visual language as the transactions themselves. The AI
// isn't a black box — it's a transparent analyst working alongside
// your ledger."
//
// THE TYPING ANIMATION:
// Each log entry "types on" character by character — like a receipt
// printer or a terminal. This is mechanical, not soft. It signals
// computation, not conversation.
//
// WHY "use client"?
// This component uses:
//   - useState (to track which entries are visible + typed text)
//   - useEffect (to run the animation on mount)
//   - setInterval (a browser timer API)
// All of these require a Client Component.
// ============================================================

import { useState, useEffect, useRef } from "react";

// ── Types ──────────────────────────────────────────────────
interface LedgerEntry {
  id: string;
  timestamp: string;
  action: string;   // "CHECKED", "QUERIED", "DETECTED", "ANSWER"
  detail: string;
  isAnswer?: boolean; // The final answer has different styling
}

// ── Sample entries (real AI entries added in Sprint 3) ─────
// For now these are static demos. When we add the AI layer,
// these will be populated by real tool call logs.
const DEMO_ENTRIES: LedgerEntry[] = [
  {
    id: "1",
    timestamp: "09:41:02",
    action: "LOADED",
    detail: "user profile · July 2026",
  },
  {
    id: "2",
    timestamp: "09:41:03",
    action: "CHECKED",
    detail: "budget: Food & Dining (₹5,800/₹8,000)",
  },
  {
    id: "3",
    timestamp: "09:41:04",
    action: "QUERIED",
    detail: "last 30 days · category=Food",
  },
  {
    id: "4",
    timestamp: "09:41:05",
    action: "DETECTED",
    detail: "recurring: Zomato ×4/week avg",
  },
  {
    id: "5",
    timestamp: "09:41:06",
    action: "CHECKED",
    detail: "budget: Transport (₹3,980/₹3,000) ⚠",
  },
  {
    id: "6",
    timestamp: "09:41:07",
    action: "ANSWER",
    detail: "Transport is ₹980 over budget this month. Mostly Uber (4 trips) and monthly petrol. Food is within budget — good trend. Savings rate: 22% of income.",
    isAnswer: true,
  },
];

// ── Utility: current time as HH:MM:SS ─────────────────────
function nowTime() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// ── Main Component ─────────────────────────────────────────
export default function LedgerTrail() {
  // Which entries are currently visible (we reveal them one by one)
  const [visibleCount, setVisibleCount] = useState(0);
  
  // For each visible entry, track how many characters have been typed
  const [typedChars, setTypedChars] = useState<Record<string, number>>({});
  
  // Track whether component is mounted (to prevent memory leaks)
  const mountedRef = useRef(true);
  
  useEffect(() => {
    mountedRef.current = true;
    
    // Reveal entries one by one with a delay between each
    const revealEntry = (index: number) => {
      if (!mountedRef.current || index >= DEMO_ENTRIES.length) return;
      
      setVisibleCount(index + 1);
      
      const entry = DEMO_ENTRIES[index];
      const fullText = `${entry.action}  ${entry.detail}`;
      let charIndex = 0;
      
      // Type the entry character by character
      // Each character appears every 18ms → feels like a fast receipt printer
      const typeInterval = setInterval(() => {
        if (!mountedRef.current) {
          clearInterval(typeInterval);
          return;
        }
        
        charIndex++;
        setTypedChars(prev => ({ ...prev, [entry.id]: charIndex }));
        
        if (charIndex >= fullText.length) {
          clearInterval(typeInterval);
          
          // After typing finishes, wait 600ms before revealing next entry
          if (index + 1 < DEMO_ENTRIES.length) {
            setTimeout(() => revealEntry(index + 1), 600);
          }
        }
      }, 18); // 18ms per character
    };
    
    // Start the animation after a 1 second delay (page needs to load first)
    const startTimeout = setTimeout(() => revealEntry(0), 1000);
    
    return () => {
      mountedRef.current = false;
      clearTimeout(startTimeout);
    };
  }, []);
  
  return (
    <aside className="ledger-trail" aria-label="AI Analysis Trail">
      {/* Header */}
      <div className="trail-header">
        <span className="trail-header-label label">Ledger Trail</span>
        <span className="trail-status">
          {/* Animated pulse dot — shows "live" */}
          <span className="trail-pulse" aria-hidden="true" />
          <span className="trail-status-text">live</span>
        </span>
      </div>
      
      {/* Log entries */}
      <div className="trail-entries" aria-live="polite" aria-label="AI analysis entries">
        {DEMO_ENTRIES.slice(0, visibleCount).map((entry) => {
          const fullText = `${entry.action}  ${entry.detail}`;
          const chars = typedChars[entry.id] ?? 0;
          // Show only the typed portion, rest is invisible placeholder
          const typed = fullText.slice(0, chars);
          const isFullyTyped = chars >= fullText.length;
          
          if (entry.isAnswer) {
            return (
              <div key={entry.id} className="trail-answer">
                <div className="trail-answer-border" />
                <p className="trail-answer-text">
                  {typed}
                  {!isFullyTyped && <span className="trail-cursor" aria-hidden="true">▌</span>}
                </p>
              </div>
            );
          }
          
          return (
            <div key={entry.id} className="trail-entry">
              {/* The brass arrow marker — the "stamp" signature */}
              <span className="trail-arrow" aria-hidden="true">⟶</span>
              
              <div className="trail-entry-body">
                <span className="trail-time">{entry.timestamp}</span>
                <span className="trail-text">
                  {/* Action word (CHECKED, QUERIED etc.) */}
                  <span className={`trail-action trail-action--${entry.action.toLowerCase()}`}>
                    {typed.slice(0, entry.action.length)}
                  </span>
                  {/* Detail text */}
                  <span className="trail-detail">
                    {typed.slice(entry.action.length)}
                  </span>
                  {!isFullyTyped && <span className="trail-cursor" aria-hidden="true">▌</span>}
                </span>
              </div>
            </div>
          );
        })}
        
        {/* Empty state — written in ledger's voice, not generic illustration */}
        {visibleCount === 0 && (
          <p className="trail-empty">— awaiting analysis —</p>
        )}
      </div>
      
      {/* Ask a question input — we'll wire this up in Sprint 3 */}
      <div className="trail-input-area">
        <div className="trail-input-divider" />
        <p className="trail-input-hint muted">
          AI copilot active in Sprint 3 ›
        </p>
      </div>
      
      <style jsx>{`
        .ledger-trail {
          width: var(--trail-width);
          min-height: 100vh;
          background: var(--vault);
          display: flex;
          flex-direction: column;
          position: fixed;
          right: 0;
          top: 0;
          bottom: 0;
          border-left: 1px solid rgba(255,255,255,0.06);
          overflow-y: auto;
        }
        
        .trail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-5) var(--space-5) var(--space-4);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: sticky;
          top: 0;
          background: var(--vault);
          z-index: 1;
        }
        
        .trail-header .label {
          color: rgba(255,255,255,0.4);
        }
        
        .trail-status {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }
        
        .trail-pulse {
          width: 6px;
          height: 6px;
          background: var(--gain);
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        .trail-status-text {
          font-size: 0.6875rem;
          color: var(--gain);
          font-family: var(--font-mono);
        }
        
        .trail-entries {
          flex: 1;
          padding: var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        
        .trail-entry {
          display: flex;
          align-items: flex-start;
          gap: var(--space-2);
        }
        
        .trail-arrow {
          color: var(--brass);
          font-size: 0.625rem;
          margin-top: 3px;
          flex-shrink: 0;
        }
        
        .trail-entry-body {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }
        
        .trail-time {
          font-family: var(--font-mono);
          font-size: 0.625rem;
          color: rgba(255,255,255,0.25);
          letter-spacing: 0.04em;
        }
        
        .trail-text {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: rgba(255,255,255,0.6);
          line-height: 1.4;
          word-break: break-word;
        }
        
        .trail-action {
          color: var(--brass);
          margin-right: 0.5ch;
        }
        
        .trail-action--answer {
          color: white;
        }
        
        .trail-detail {
          color: rgba(255,255,255,0.55);
        }
        
        /* The blinking cursor during typing */
        .trail-cursor {
          color: var(--brass);
          animation: blink 0.6s step-end infinite;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        /* The AI answer block — separated from the tool calls */
        .trail-answer {
          display: flex;
          gap: var(--space-3);
          margin-top: var(--space-2);
          padding-top: var(--space-2);
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        
        .trail-answer-border {
          width: 2px;
          background: var(--brass);
          border-radius: 1px;
          flex-shrink: 0;
          align-self: stretch;
          min-height: 1em;
        }
        
        .trail-answer-text {
          font-size: 0.8125rem;
          color: rgba(255,255,255,0.85);
          line-height: 1.55;
          font-weight: 300;
        }
        
        .trail-empty {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: rgba(255,255,255,0.2);
          text-align: center;
          margin-top: var(--space-8);
          letter-spacing: 0.05em;
        }
        
        .trail-input-area {
          padding: var(--space-4) var(--space-5);
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        
        .trail-input-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin-bottom: var(--space-3);
        }
        
        .trail-input-hint {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.25);
          font-family: var(--font-mono);
          text-align: center;
        }
        
        /* Accessibility: disable animation if user prefers */
        @media (prefers-reduced-motion: reduce) {
          .trail-pulse { animation: none; opacity: 1; }
          .trail-cursor { animation: none; }
        }
      `}</style>
    </aside>
  );
}
