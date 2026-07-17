"use client";
// components/copilot/CopilotPanel.tsx
// Uses AI SDK v4 — useChat from 'ai/react'
// (v7 moved it to '@ai-sdk/react' with a completely different API)
//
// useChat(v4) returns:
//   messages     — array of { id, role, content }
//   input        — controlled input string
//   handleInputChange — onChange handler for <input> or <textarea>
//   handleSubmit — onSubmit handler for <form>
//   isLoading    — true while streaming
//   error        — Error object if request failed
//
// HOW STREAMING WORKS (interview answer):
// "useChat sends a POST to /api/chat with the messages array.
//  The server returns a ReadableStream formatted as SSE.
//  useChat reads each chunk and appends it to the last assistant
//  message incrementally — that's why you see text appear word by word."

import { useChat } from "ai/react";
import type { UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";

const SUGGESTED_PROMPTS = [
  { icon: "📊", text: "How much did I spend on food this month?" },
  { icon: "⚠️", text: "Which categories am I overspending in?" },
  { icon: "💰", text: "How close am I to my savings goals?" },
  { icon: "🔄", text: "Do I have any recurring payments I should know about?" },
];

export default function CopilotPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const bottomRef           = useRef<HTMLDivElement>(null);
  const inputRef            = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
  } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: "Hi! I'm Finpilot. I can see your transactions and budgets — ask me anything about your spending.",
      },
    ],
  });

  // Auto-scroll to bottom as new tokens stream in
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  // Enter = send, Shift+Enter = newline
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }
    }
  }

  // Click a suggestion chip → fill input and submit
  function useSuggestion(text: string) {
    const synthetic = { target: { value: text } } as React.ChangeEvent<HTMLTextAreaElement>;
    handleInputChange(synthetic);
    setTimeout(() => {
      (document.getElementById("copilot-form") as HTMLFormElement)?.requestSubmit();
    }, 50);
  }

  const userMsgCount = messages.filter((m: UIMessage) => m.role === "user").length;

  return (
    <>
      {/* ── Floating trigger ─────────────────────────────── */}
      <button
        className={`copilot-trigger ${isOpen ? "copilot-trigger--open" : ""}`}
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Close Finpilot" : "Open Finpilot AI"}
      >
        <span className="copilot-trigger-icon">{isOpen ? "×" : "⬡"}</span>
      </button>

      {/* ── Chat panel ───────────────────────────────────── */}
      {isOpen && (
        <div className="copilot-panel" role="dialog" aria-label="Finpilot AI">

          {/* Header */}
          <div className="copilot-header">
            <div className="copilot-header-left">
              <span className="copilot-header-icon">⬡</span>
              <div>
                <p className="copilot-header-name">Finpilot</p>
                <p className="copilot-header-status">{isLoading ? "Thinking…" : "Ready"}</p>
              </div>
            </div>
            <button className="copilot-close" onClick={() => setIsOpen(false)}>×</button>
          </div>

          {/* Messages */}
          <div className="copilot-messages">
            {messages.map((m: UIMessage) => (
              <div key={m.id} className={`copilot-msg copilot-msg--${m.role}`}>
                {m.role === "assistant" && <span className="copilot-msg-icon">⬡</span>}
                <div className="copilot-msg-content">{m.content}</div>
              </div>
            ))}

            {/* Animated dots while waiting for first token */}
            {isLoading && (
              <div className="copilot-msg copilot-msg--assistant">
                <span className="copilot-msg-icon">⬡</span>
                <div className="copilot-thinking">
                  <span /><span /><span />
                </div>
              </div>
            )}

            {error && (
              <div className="copilot-error">⚠ {error.message || "Something went wrong."}</div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggested prompts — only before first user message */}
          {userMsgCount === 0 && (
            <div className="copilot-suggestions">
              {SUGGESTED_PROMPTS.map((p) => (
                <button key={p.text} className="copilot-suggestion-btn" onClick={() => useSuggestion(p.text)}>
                  <span>{p.icon}</span>
                  <span>{p.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form id="copilot-form" className="copilot-input-form" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              className="copilot-input"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your finances…"
              rows={1}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="copilot-send-btn"
              disabled={isLoading || !input.trim()}
              aria-label="Send"
            >
              {isLoading ? "…" : "↑"}
            </button>
          </form>

          <p className="copilot-footer-note muted">Enter to send · Shift+Enter for newline</p>
        </div>
      )}
    </>
  );
}
