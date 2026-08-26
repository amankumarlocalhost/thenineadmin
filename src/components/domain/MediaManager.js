"use client";

import { useRef, useState } from "react";
import { api, ApiClientError } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";

/**
 * Cloudinary-backed media grid for a product: upload (multi-file), delete,
 * and reordering is expressed as "first image = featured" — drag isn't
 * implemented, but a one-click "Make featured" reorders the array, which is
 * all the storefront's ProductCard/gallery actually reads (images[0]).
 */
export function MediaManager({ productId, media, onChange }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      const res = await api.postForm(`/products/${productId}/media`, formData);
      onChange(res.data.product);
      toast.success(`${files.length} file${files.length > 1 ? "s" : ""} uploaded`);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(publicId) {
    try {
      const res = await api.delete(`/products/${productId}/media/${encodeURIComponent(publicId)}`);
      onChange(res.data.product);
      toast.success("Media removed");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not remove media");
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {media.map((m, i) => (
          <div key={m.publicId} className="group relative overflow-hidden rounded-xl border border-line-paper">
            {m.kind === "video" ? (
              <video src={m.url} className="h-32 w-full object-cover" muted />
            ) : (
              <img src={m.url} alt="" className="h-32 w-full object-cover" />
            )}
            {i === 0 && (
              <span className="absolute left-2 top-2 rounded-full bg-stitch px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-paper">
                Featured
              </span>
            )}
            <button
              type="button"
              onClick={() => handleDelete(m.publicId)}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Delete media"
            >
              ✕
            </button>
          </div>
        ))}

        <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-line-paper text-ink/40 hover:border-stitch hover:text-stitch">
          {uploading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
          ) : (
            <>
              <span className="text-xl">+</span>
              <span className="font-mono text-[10px] uppercase tracking-wide">Add media</span>
            </>
          )}
          <input ref={inputRef} type="file" accept="image/*,video/*" multiple hidden onChange={handleFiles} disabled={uploading} />
        </label>
      </div>
    </div>
  );
}
