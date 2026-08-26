"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";

function useEscapeToClose(onClose) {
  useEffect(() => {
    function handler(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
}

export function Modal({ open, onClose, title, children, footer, width = "max-w-lg" }) {
  useEscapeToClose(onClose);
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 animate-fade-in" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${width} animate-slide-up rounded-2xl bg-surface shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-line-paper px-6 py-4">
          <h2 className="font-serif text-lg text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-ink/50 hover:bg-black/5">
            ✕
          </button>
        </div>
        <div className="admin-scroll max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line-paper px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function Drawer({ open, onClose, title, children, footer, width = "max-w-xl" }) {
  useEscapeToClose(onClose);
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40 animate-fade-in" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`animate-drawer-in flex h-full w-full ${width} flex-col bg-surface shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-line-paper px-6 py-4">
          <h2 className="font-serif text-lg text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-ink/50 hover:bg-black/5">
            ✕
          </button>
        </div>
        <div className="admin-scroll flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line-paper px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title = "Are you sure?", description, confirmLabel = "Confirm", danger = false, loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="max-w-sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && <p className="font-body text-sm text-ink/65">{description}</p>}
    </Modal>
  );
}
