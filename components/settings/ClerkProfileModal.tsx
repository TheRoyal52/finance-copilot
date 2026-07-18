"use client";
// components/settings/ClerkProfileModal.tsx
// Client Component — embeds Clerk's UserProfile UI in a modal overlay.
// The settings page is a Server Component; this is the only client piece.
//
// WHY A MODAL AND NOT A NEW PAGE?
// Clerk provides a pre-built <UserProfile /> component that handles:
//   - Name & profile photo changes
//   - Email management
//   - Connected OAuth accounts
//   - Security (2FA, active sessions)
// Rather than redirecting the user away to accounts.clerk.com or building
// all of this ourselves, we embed it inline in a modal for a seamless UX.

import { UserProfile } from "@clerk/nextjs";
import { useState } from "react";

export default function ClerkProfileModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        id="manage-account-btn"
        className="settings-manage-btn"
        onClick={() => setOpen(true)}
      >
        <span>⚙</span> Manage Account &amp; Security
      </button>

      {open && (
        <div
          className="clerk-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Account settings"
          onClick={(e) => {
            // Close when clicking the dark overlay (not the content)
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="clerk-modal-inner">
            <button
              className="clerk-modal-close"
              onClick={() => setOpen(false)}
              aria-label="Close account settings"
            >
              ×
            </button>
            <UserProfile
              appearance={{
                elements: {
                  rootBox: "clerk-profile-root",
                  card: "clerk-profile-card",
                },
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
