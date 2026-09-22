"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import { api, ApiClientError, API_URL } from "@/lib/api";
import { ShippingLabelPreview } from "./ShippingLabelPreview";

// Generates (idempotently, per shipment.service.js#getOrCreateShipment) and
// previews the shipping label for one order. Does not touch the order itself.
export function ShippingLabelModal({ open, onClose, orderNumber }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [label, setLabel] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    // Deferred a tick so the first state update lands as an update rather
    // than a synchronous setState-in-effect (matches useFetch.js's own
    // pattern in this codebase).
    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      setLabel(null);

      api
        .post(`/shipments/order/${orderNumber}`)
        .then((res) => {
          if (!cancelled) setLabel(res.data.label);
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof ApiClientError ? err.message : "Could not generate the shipping label.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [open, orderNumber, attempt]);

  function handleClose() {
    setLabel(null);
    setError(null);
    onClose();
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`${API_URL}/shipments/order/${orderNumber}/pdf`, { credentials: "include" });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${label?.shipmentId || orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download the shipping label PDF.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Shipping Label"
      width="max-w-md"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Close
          </Button>
          <Button variant="secondary" onClick={() => window.print()} disabled={!label}>
            Print Label
          </Button>
          <Button onClick={handleDownload} loading={downloading} disabled={!label}>
            Download PDF
          </Button>
        </>
      }
    >
      {loading && <p className="py-8 text-center font-body text-sm text-ink/50">Generating shipping label…</p>}
      {error && !loading && (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-center font-body text-sm text-danger">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => setAttempt((n) => n + 1)}>
            Retry
          </Button>
        </div>
      )}
      {!loading && !error && label && <ShippingLabelPreview label={label} />}
    </Modal>
  );
}
