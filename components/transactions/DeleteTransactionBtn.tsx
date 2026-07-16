"use client";
// components/transactions/DeleteTransactionBtn.tsx
// Inline delete button for each table row

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTransaction } from "@/lib/actions/transactions";

export default function DeleteTransactionBtn({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirmed) {
      // First click: show confirmation state
      setConfirmed(true);
      // Auto-reset after 3 seconds if user changes mind
      setTimeout(() => setConfirmed(false), 3000);
      return;
    }

    // Second click: actually delete
    setIsDeleting(true);
    const result = await deleteTransaction(id);
    if (!result.error) {
      router.refresh();
    } else {
      console.error(result.error);
      setIsDeleting(false);
      setConfirmed(false);
    }
  }

  return (
    <button
      className={`delete-tx-btn ${confirmed ? "delete-tx-btn--confirm" : ""}`}
      onClick={handleDelete}
      disabled={isDeleting}
      title={confirmed ? "Click again to confirm" : "Delete transaction"}
      aria-label={confirmed ? "Confirm delete" : "Delete transaction"}
    >
      {isDeleting ? "…" : confirmed ? "Confirm?" : "×"}
    </button>
  );
}
