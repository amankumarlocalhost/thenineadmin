"use client";

import { useCallback, useMemo, useState } from "react";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api, ApiClientError } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/EmptyState";

const EMPTY = { title: "", icon: "shipping", align: "left", isActive: true };

// Keys must match ANNOUNCEMENT_ICONS in the shop's AnnouncementBar. An unknown
// key there renders the text with no mark, so a mismatch is cosmetic rather
// than a crash — but keep them in step.
const ICONS = [
  { value: "shipping", label: "Delivery van", glyph: "🚚" },
  { value: "gift", label: "Gift / new drops", glyph: "🎁" },
  { value: "returns", label: "Returns", glyph: "↩" },
  { value: "offer", label: "Offer tag", glyph: "🏷" },
  { value: "support", label: "Support", glyph: "🎧" },
  { value: "secure", label: "Secure payment", glyph: "🛡" },
  { value: "sparkle", label: "Sparkle", glyph: "✦" },
  { value: "", label: "No icon — text only", glyph: "" },
];

const ALIGNS = [
  { value: "left", label: "Left side of the bar" },
  { value: "center", label: "Middle" },
  { value: "right", label: "Right side of the bar" },
];

function glyphFor(key) {
  return ICONS.find((i) => i.value === key)?.glyph ?? "";
}

function PreviewGroup({ items, side }) {
  return items
    .filter((item) => (item.align || "left") === side)
    .map((item) => (
      <span
        key={item._id}
        className="flex shrink-0 items-center gap-1.5 whitespace-nowrap font-body text-[10px] font-medium uppercase tracking-[0.12em]"
      >
        {glyphFor(item.icon) && <span>{glyphFor(item.icon)}</span>}
        {item.title}
      </span>
    ));
}

export default function AnnouncementBarPage() {
  usePageTitle("Announcement Bar");
  const toast = useToast();

  const fetchItems = useCallback(
    () => api.get("/content/admin", { section: "announcement" }).then((r) => r.data.items),
    []
  );
  const { data, loading, error, reload } = useFetch(fetchItems, [fetchItems]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const items = useMemo(() => [...(data || [])].sort((a, b) => a.sortOrder - b.sortOrder), [data]);

  // What the shop will actually show: hidden rows and blank text drop out.
  const live = useMemo(() => items.filter((i) => i.isActive && i.title), [items]);

  function open(item = null) {
    setEditing(item);
    setFormError("");
    setForm(
      item
        ? {
            title: item.title || "",
            icon: item.icon ?? "",
            align: item.align || "left",
            isActive: item.isActive !== false,
          }
        : EMPTY
    );
    setModalOpen(true);
  }

  async function save() {
    setFormError("");
    if (!form.title.trim()) return setFormError("Write the message first.");

    setSaving(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        section: "announcement",
        sortOrder: editing ? editing.sortOrder : items.length,
      };
      if (editing) await api.patch(`/content/${editing._id}`, payload);
      else await api.post("/content", payload);
      toast.success(editing ? "Message updated" : "Message added");
      setModalOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item) {
    setBusy(true);
    try {
      await api.patch(`/content/${item._id}`, { isActive: !item.isActive });
      toast.success(item.isActive ? "Message hidden" : "Message is live");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not update");
    } finally {
      setBusy(false);
    }
  }

  async function move(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    setBusy(true);
    try {
      // Only the two that swapped need writing.
      await Promise.all([
        api.patch(`/content/${items[index]._id}`, { sortOrder: target }),
        api.patch(`/content/${items[target]._id}`, { sortOrder: index }),
      ]);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not reorder");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api.delete(`/content/${confirmDelete._id}`);
      toast.success("Message deleted");
      setConfirmDelete(null);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-body text-lg font-semibold text-ink">Announcement bar</h2>
            <p className="mt-1 max-w-2xl font-body text-sm text-ink/55">
              The thin maroon strip above the logo. Each message is pinned to the left, the middle or the right of
              the bar — so one can sit at each end.
              {live.length === 0 && " Nothing is live, so the built-in messages are showing."}
            </p>
          </div>
          <Button size="sm" onClick={() => open()}>
            + New Message
          </Button>
        </div>
      </Card>

      {/* Shown at the bar's real proportions and colours, because left vs.
          right only means anything across the full width. */}
      <Card padded={false}>
        <p className="px-4 pt-4 font-body text-xs font-semibold uppercase tracking-wider text-ink/45">Preview</p>
        <div className="p-4">
          <div className="rounded-lg bg-[#3d1420] px-4 py-1.5 text-white/90 md:px-10">
            <div className="flex items-center gap-4">
              <div className="flex flex-1 items-center justify-start gap-5">
                <PreviewGroup items={live} side="left" />
              </div>
              <div className="flex items-center justify-center gap-5">
                <PreviewGroup items={live} side="center" />
              </div>
              <div className="flex flex-1 items-center justify-end gap-5">
                <PreviewGroup items={live} side="right" />
              </div>
            </div>
          </div>
          {live.length === 0 && (
            <p className="mt-2 font-body text-xs text-ink/40">
              Empty — the shop falls back to its three built-in messages until you publish one.
            </p>
          )}
        </div>
      </Card>

      {loading && !data ? (
        <Skeleton className="h-48 w-full" />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            title="No messages yet"
            description="Add one and it replaces the built-in strip straight away."
          />
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item, i) => (
            <li key={item._id}>
              <Card padded={false}>
                <div className="flex flex-wrap items-center gap-3 p-4">
                  <span className="w-6 text-center text-lg" aria-hidden="true">
                    {glyphFor(item.icon)}
                  </span>

                  <div className="min-w-[12rem] flex-1">
                    <p className="font-body text-sm font-medium text-ink">{item.title || "(no text)"}</p>
                    <p className="mt-0.5 font-body text-xs text-ink/45">
                      {ALIGNS.find((a) => a.value === (item.align || "left"))?.label}
                    </p>
                  </div>

                  <Badge tone={item.isActive ? "success" : "neutral"}>{item.isActive ? "Live" : "Hidden"}</Badge>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy || i === 0}
                      onClick={() => move(i, -1)}
                      aria-label="Move up"
                    >
                      ↑
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy || i === items.length - 1}
                      onClick={() => move(i, 1)}
                      aria-label="Move down"
                    >
                      ↓
                    </Button>
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => toggleActive(item)}>
                      {item.isActive ? "Hide" : "Show"}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => open(item)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(item)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit message" : "New message"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Message">
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Free shipping on orders over ₹999"
              maxLength={80}
            />
            <p className="mt-1 font-body text-xs text-ink/40">
              Shown in capitals on the shop. Keep it short — the bar is one line and never wraps.
            </p>
          </Field>

          <Field label="Position">
            <Select value={form.align} onChange={(e) => setForm((f) => ({ ...f, align: e.target.value }))}>
              {ALIGNS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </Select>
            <p className="mt-1 font-body text-xs text-ink/40">
              Two messages on the same side sit next to each other.
            </p>
          </Field>

          <Field label="Icon">
            <Select value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}>
              {ICONS.map((ic) => (
                <option key={ic.value || "none"} value={ic.value}>
                  {ic.glyph ? `${ic.glyph}  ${ic.label}` : ic.label}
                </option>
              ))}
            </Select>
          </Field>

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4 accent-stitch"
            />
            <span className="font-body text-sm text-ink">Show this message on the shop</span>
          </label>

          {formError && <p className="font-body text-xs text-danger">{formError}</p>}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={remove}
        loading={busy}
        danger
        title="Delete this message?"
        description="It is removed from the announcement bar permanently."
        confirmLabel="Delete"
      />
    </div>
  );
}
