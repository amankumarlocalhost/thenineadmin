"use client";

import { useCallback, useRef, useState } from "react";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api, ApiClientError } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

export default function MediaLibraryPage() {
  usePageTitle("Media Library");
  const toast = useToast();
  const [type, setType] = useState("image");
  const [folder, setFolder] = useState("");
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const fetchLibrary = useCallback(
    () => api.get("/uploads/library", { type, folder: folder || undefined, limit: 60 }).then((r) => r.data.items),
    [type, folder]
  );
  const { data: items, loading, error, reload } = useFetch(fetchLibrary, [fetchLibrary]);

  async function handleUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      await api.postForm(`/uploads/batch?folder=${folder || "misc"}`, formData);
      toast.success(`${files.length} file(s) uploaded`);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(item) {
    try {
      await api.delete("/uploads", { publicId: item.publicId, kind: item.kind });
      toast.success("Deleted");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not delete");
    }
  }

  function copyUrl(url) {
    navigator.clipboard?.writeText(url);
    toast.success("URL copied");
  }

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <Card
      title="Cloudinary Media"
      action={
        <div className="flex items-center gap-2">
          <Select value={type} onChange={(e) => setType(e.target.value)} className="w-28">
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </Select>
          <Select value={folder} onChange={(e) => setFolder(e.target.value)} className="w-36">
            <option value="">All folders</option>
            <option value="products">Products</option>
            <option value="categories">Categories</option>
            <option value="homepage">Homepage</option>
            <option value="profiles">Profiles</option>
            <option value="misc">Misc / Uploaded</option>
          </Select>
          <Button size="sm" loading={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? "Uploading…" : "+ Upload"}
          </Button>
          <input ref={inputRef} type="file" accept="image/*,video/*" multiple hidden onChange={handleUpload} disabled={uploading} />
        </div>
      }
    >
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : !items?.length ? (
        <EmptyState title="No media in this folder yet" description="Uploads from products, content blocks, and this page all appear here." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => (
            <div key={item.publicId} className="group relative overflow-hidden rounded-xl border border-line-paper">
              {item.kind === "video" ? (
                <video src={item.url} className="h-28 w-full object-cover" muted />
              ) : (
                <img src={item.url} alt="" className="h-28 w-full object-cover" />
              )}
              <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-ink/70 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button type="button" onClick={() => copyUrl(item.url)} className="rounded-full bg-white/90 px-2 py-1 font-mono text-[9px] uppercase text-ink">Copy</button>
                <button type="button" onClick={() => handleDelete(item)} className="rounded-full bg-danger px-2 py-1 font-mono text-[9px] uppercase text-white">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
