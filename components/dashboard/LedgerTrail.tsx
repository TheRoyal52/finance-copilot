"use client";
// components/dashboard/LedgerTrail.tsx
// Client Component — uses useState + useEffect for typing animation

import { useState, useEffect, useRef } from "react";

interface LedgerEntry {
  id: string;
  timestamp: string;
  action: string;
  detail: string;
  isAnswer?: boolean;
}

const DEMO_ENTRIES: LedgerEntry[] = [
  { id: "1", timestamp: "09:41:02", action: "LOADED",   detail: "user profile · July 2026" },
  { id: "2", timestamp: "09:41:03", action: "CHECKED",  detail: "budget: Food & Dining (₹5,800/₹8,000)" },
  { id: "3", timestamp: "09:41:04", action: "QUERIED",  detail: "last 30 days · category=Food" },
  { id: "4", timestamp: "09:41:05", action: "DETECTED", detail: "recurring: Zomato ×4/week avg" },
  { id: "5", timestamp: "09:41:06", action: "CHECKED",  detail: "budget: Transport (₹3,980/₹3,000) ⚠" },
  {
    id: "6", timestamp: "09:41:07", action: "ANSWER",
    detail: "Transport is ₹980 over budget this month. Mostly Uber (4 trips) and monthly petrol. Food is within budget — good trend. Savings rate: 22% of income.",
    isAnswer: true,
  },
];

export default function LedgerTrail() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [typedChars, setTypedChars] = useState<Record<string, number>>({});
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const revealEntry = (index: number) => {
      if (!mountedRef.current || index >= DEMO_ENTRIES.length) return;
      setVisibleCount(index + 1);

      const entry = DEMO_ENTRIES[index];
      const fullText = `${entry.action}  ${entry.detail}`;
      let charIndex = 0;

      const typeInterval = setInterval(() => {
        if (!mountedRef.current) { clearInterval(typeInterval); return; }
        charIndex++;
        setTypedChars(prev => ({ ...prev, [entry.id]: charIndex }));
        if (charIndex >= fullText.length) {
          clearInterval(typeInterval);
          if (index + 1 < DEMO_ENTRIES.length) {
            setTimeout(() => revealEntry(index + 1), 600);
          }
        }
      }, 18);
    };

    const start = setTimeout(() => revealEntry(0), 1000);
    return () => { mountedRef.current = false; clearTimeout(start); };
  }, []);

  return (
    <aside className="ledger-trail" aria-label="AI Analysis Trail">
      <div className="trail-header">
        <span className="trail-header-label">LEDGER TRAIL</span>
        <span className="trail-status">
          <span className="trail-pulse" aria-hidden="true" />
          <span className="trail-status-text">live</span>
        </span>
      </div>

      <div className="trail-entries" aria-live="polite">
        {DEMO_ENTRIES.slice(0, visibleCount).map((entry) => {
          const fullText = `${entry.action}  ${entry.detail}`;
          const chars = typedChars[entry.id] ?? 0;
          const typed = fullText.slice(0, chars);
          const done = chars >= fullText.length;

          if (entry.isAnswer) {
            return (
              <div key={entry.id} className="trail-answer">
                <div className="trail-answer-border" />
                <p className="trail-answer-text">
                  {typed}
                  {!done && <span className="trail-cursor" aria-hidden="true">▌</span>}
                </p>
              </div>
            );
          }

          return (
            <div key={entry.id} className="trail-entry">
              <span className="trail-arrow" aria-hidden="true">⟶</span>
              <div className="trail-entry-body">
                <span className="trail-time">{entry.timestamp}</span>
                <span className="trail-text">
                  <span className="trail-action">{typed.slice(0, entry.action.length)}</span>
                  <span className="trail-detail">{typed.slice(entry.action.length)}</span>
                  {!done && <span className="trail-cursor" aria-hidden="true">▌</span>}
                </span>
              </div>
            </div>
          );
        })}
        {visibleCount === 0 && <p className="trail-empty">— awaiting analysis —</p>}
      </div>

      <div className="trail-footer">
        <p className="trail-footer-hint">AI copilot active in Sprint 3 ›</p>
      </div>
    </aside>
  );
}
