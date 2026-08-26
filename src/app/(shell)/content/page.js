"use client";

import { useCallback, useRef, useState } from "react";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api, ApiClientError } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { CONTENT_SECTIONS } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

const EMPTY = { title: "", subtitle: "", body: "", ctaLabel: "", ctaHref: "", sortOrder: 0, isActive: true };

export default function ContentPage() {
  usePageTitle("Homepage Content");
  const toast = useToast();
  const [section, setSection] = useState(CONTENT_SECTIONS[0].value);

  const fetchItems = useCallback(() => api.get("/content/admin", { section }).then((r) => r.data.items), [section]);
  const { data: items, loading, error, reload } = useFetch(fetchItems, [fetchItems]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }
  function openEdit(item) {
    setEditing(item);
    setForm({
      title: item.title || "",
      subtitle: item.subtitle || "",
      body: item.body || "",
      ctaLabel: item.ctaLabel || "",
      ctaHref: item.ctaHref || "",
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/content/${editing._id}`, form);
        toast.success("Updated");
      } else {
        await api.post("/content", { ...form, section });
        toast.success("Created");
      }
      setModalOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    try {
      await api.delete(`/content/${item._id}`);
      toast.success("Deleted");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not delete");
    }
  }

  async function handleToggleActive(item) {
    try {
      await api.patch(`/content/${item._id}`, { isActive: !item.isActive });
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not update");
    }
  }

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {CONTENT_SECTIONS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setSection(s.value)}
            className={`rounded-full border px-4 py-1.5 font-mono text-[11px] font-medium ${
              section === s.value ? "border-stitch bg-stitch text-paper" : "border-line-paper text-ink/60 hover:border-stitch hover:text-stitch"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <Card
        title={CONTENT_SECTIONS.find((s) => s.value === section)?.label}
        action={<Button size="sm" onClick={openCreate}>+ Add</Button>}
      >
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : !items?.length ? (
          <EmptyState title="Nothing here yet" description="Add the first item for this section." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ContentItemCard key={item._id} item={item} onEdit={() => openEdit(item)} onDelete={() => handleDelete(item)} onToggle={() => handleToggleActive(item)} onMediaChange={reload} />
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Content Block" : "New Content Block"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Title"><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></Field>
          <Field label="Subtitle"><Input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} /></Field>
          <Field label="Body"><Textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Button Label"><Input value={form.ctaLabel} onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))} /></Field>
            <Field label="Button Link"><Input value={form.ctaHref} onChange={(e) => setForm((f) => ({ ...f, ctaHref: e.target.value }))} placeholder="/category/new-arrivals" /></Field>
          </div>
          <Field label="Display Order"><Input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))} /></Field>
          <label className="flex items-center gap-2 font-body text-sm text-ink">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 accent-stitch" />
            Active
          </label>
        </div>
      </Modal>
    </>
  );
}

function ContentItemCard({ item, onEdit, onDelete, onToggle, onMediaChange }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.postForm(`/content/${item._id}/media`, formData);
      toast.success("Media updated");
      onMediaChange();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line-paper">
      <label className="relative block h-32 cursor-pointer bg-surface-sunken">
        {item.media?.url ? (
          item.media.kind === "video" ? (
            <video src={item.media.url} className="h-full w-full object-cover" muted />
          ) : (
            <img src={item.media.url} alt="" className="h-full w-full object-cover" />
          )
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-[10px] uppercase tracking-wide text-ink/35">
            {uploading ? "Uploading…" : "Click to add media"}
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*,video/*" hidden onChange={handleUpload} disabled={uploading} />
      </label>
      <div className="p-3.5">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <p className="truncate font-body text-sm text-ink">{item.title || "(untitled)"}</p>
          <Badge tone={item.isActive ? "success" : "neutral"}>{item.isActive ? "Active" : "Off"}</Badge>
        </div>
        {item.subtitle && <p className="truncate font-body text-xs text-ink/50">{item.subtitle}</p>}
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="secondary" onClick={onEdit}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={onToggle}>{item.isActive ? "Turn off" : "Turn on"}</Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="ml-auto text-danger hover:bg-danger-bg">Delete</Button>
        </div>
      </div>
    </div>
  );
}
