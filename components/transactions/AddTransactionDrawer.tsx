"use client";
// components/transactions/AddTransactionDrawer.tsx
// ============================================================
// CLIENT COMPONENT — Slide-in drawer for adding transactions
// ============================================================
//
// WHY A DRAWER INSTEAD OF A PAGE?
// If we navigated to /transactions/new, the user loses their
// context (scroll position, active filters). A drawer overlays
// the current page — user stays oriented while adding data.
//
// WHY A SERVER ACTION INSTEAD OF AN API ROUTE?
// Traditional approach: form submit → POST /api/transactions →
//   server validates → inserts to DB → client re-fetches → shows update
//
// Server Action approach: form submit → function runs ON SERVER →
//   inserts to DB → revalidatePath() tells Next.js to re-render →
//   page updates automatically. No API route, no fetch() needed.
//
// Server Actions are a Next.js 14+ feature. They look like normal
// async functions but they run server-side. The form's action prop
// points directly to the function — Next.js handles the rest.
//
// OPTIMISTIC UI PATTERN (future improvement):
// Right now: user submits → waits for server → page refreshes
// Better: show the transaction immediately while server saves
// (useOptimistic hook — we'll add this later)
// ============================================================

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { addTransaction } from "@/lib/actions/transactions";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface AddTransactionDrawerProps {
  categories: Category[];
}

export default function AddTransactionDrawer({ categories }: AddTransactionDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const incomeCategories  = categories.filter((c) => c.type === "INCOME");
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);

    try {
      const result = await addTransaction(formData);
      if (result.error) {
        setError(result.error);
      } else {
        // Success — close drawer and refresh the page data
        setIsOpen(false);
        formRef.current?.reset();
        router.refresh(); // Tells Next.js to re-run Server Component data fetch
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        id="add-transaction-btn"
        className="add-tx-btn"
        onClick={() => setIsOpen(true)}
        aria-label="Add new transaction"
      >
        <span aria-hidden="true">+</span>
        <span>Add Transaction</span>
      </button>

      {/* Overlay backdrop */}
      {isOpen && (
        <div
          className="drawer-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <aside
        className={`drawer ${isOpen ? "drawer--open" : ""}`}
        aria-label="Add transaction"
        aria-modal="true"
        role="dialog"
      >
        <div className="drawer-header">
          <h2 className="drawer-title display">New Entry</h2>
          <button
            className="drawer-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close drawer"
          >
            ×
          </button>
        </div>

        <form
          ref={formRef}
          action={handleSubmit}
          className="drawer-form"
          noValidate
        >
          {/* Amount field */}
          <div className="field-group">
            <label htmlFor="amount" className="field-label label">
              Amount (₹)
            </label>
            <div className="amount-input-wrapper">
              <span className="amount-currency" aria-hidden="true">₹</span>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="field-input amount-input mono"
                required
                aria-describedby="amount-hint"
              />
            </div>
            <p id="amount-hint" className="field-hint muted">
              Enter positive number — category type determines income vs expense
            </p>
          </div>

          {/* Description field */}
          <div className="field-group">
            <label htmlFor="description" className="field-label label">
              Description
            </label>
            <input
              id="description"
              name="description"
              type="text"
              placeholder="e.g. Zomato dinner, Salary, Uber ride"
              className="field-input"
              maxLength={200}
              required
            />
          </div>

          {/* Category field */}
          <div className="field-group">
            <label htmlFor="categoryId" className="field-label label">
              Category
            </label>
            <select
              id="categoryId"
              name="categoryId"
              className="field-input field-select"
              required
            >
              <option value="">Select a category</option>
              {incomeCategories.length > 0 && (
                <optgroup label="Income">
                  {incomeCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              )}
              {expenseCategories.length > 0 && (
                <optgroup label="Expenses">
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Date field */}
          <div className="field-group">
            <label htmlFor="date" className="field-label label">
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              className="field-input"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="form-error" role="alert">
              <span aria-hidden="true">⚠</span> {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className={`form-submit ${isPending ? "form-submit--loading" : ""}`}
            disabled={isPending}
          >
            {isPending ? "Adding…" : "Add to Ledger →"}
          </button>
        </form>

        {/* UPI SMS tip */}
        <div className="drawer-tip">
          <p className="drawer-tip-title label">💡 Coming soon</p>
          <p className="drawer-tip-text muted">
            Paste a UPI SMS and we'll parse the amount, merchant and date automatically.
          </p>
        </div>
      </aside>
    </>
  );
}
