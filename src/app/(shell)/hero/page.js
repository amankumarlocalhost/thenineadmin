"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api, ApiClientError } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/EmptyState";

const EMPTY = {
  eyebrow: "",
  title: "",
  subtitle: "",
  ctaLabel: "",
  ctaHref: "",
  ctaLabel2: "",
  ctaHref2: "",
  imagePosition: "center",
  imagePositionMobile: "",
  isActive: true,
};

// How the photo sits behind the text. The copy occupies the left third, so
// "right center" is the usual choice — it keeps a model's face out from
// behind the headline.
const POSITIONS = [
  { value: "right center", label: "Right — subject on the right (usual)" },
  { value: "center", label: "Centre" },
  { value: "left center", label: "Left" },
  { value: "center top", label: "Top" },
  { value: "center bottom", label: "Bottom" },
];

export default function HeroSliderPage() {
  usePageTitle("Hero Slider");
  const toast = useToast();

  const fetchSlides = useCallback(
    () => api.get("/content/admin", { section: "hero_slide" }).then((r) => r.data.items),
    []
  );
  const { data, loading, error, reload } = useFetch(fetchSlides, [fetchSlides]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [uploadingKey, setUploadingKey] = useState(null);
  const [busy, setBusy] = useState(false);

  const slides = useMemo(
    () => [...(data || [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [data]
  );

  function open(slide = null) {
    setEditing(slide);
    setFormError("");
    setForm(
      slide
        ? {
            eyebrow: slide.eyebrow || "",
            title: slide.title || "",
            subtitle: slide.subtitle || "",
            ctaLabel: slide.ctaLabel || "",
            ctaHref: slide.ctaHref || "",
            ctaLabel2: slide.ctaLabel2 || "",
            ctaHref2: slide.ctaHref2 || "",
            imagePosition: slide.imagePosition || "center",
            imagePositionMobile: slide.imagePositionMobile || "",
            isActive: slide.isActive !== false,
          }
        : EMPTY
    );
    setModalOpen(true);
  }

  async function save() {
    setFormError("");
    if (!form.title.trim()) return setFormError("Give the slide a headline.");

    setSaving(true);
    try {
      const payload = { ...form, section: "hero_slide", sortOrder: editing ? editing.sortOrder : slides.length };
      if (editing) {
        await api.patch(`/content/${editing._id}`, payload);
        toast.success("Slide updated");
      } else {
        const res = await api.post("/content", payload);
        toast.success("Slide added — now upload its poster");
        setModalOpen(false);
        reload();
        // A slide with no photo never renders, so push straight to the upload.
        setTimeout(() => document.getElementById(`upload-${res.data.item._id}`)?.click(), 300);
        return;
      }
      setModalOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  /**
    * `variant` is "desktop" for the wide poster every slide needs, or
    * "mobile" for the optional portrait one shown under 768px.
    */
  async function upload(slideId, file, variant = "desktop") {
    if (!file) return;
    // Checked here so a 12MB phone photo fails instantly rather than after a
    // long upload the server was always going to reject.
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file.");
    if (file.size > 8 * 1024 * 1024) return toast.error("That image is over 8MB — please use a smaller one.");

    setUploadingKey(`${slideId}:${variant}`);
    try {
      const body = new FormData();
      body.append("file", file);
      await api.postForm(`/content/${slideId}/media`, body, { variant });
      toast.success(variant === "mobile" ? "Mobile poster uploaded" : "Poster uploaded");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Upload failed");
    } finally {
      setUploadingKey(null);
    }
  }

  // Clearing the mobile poster is how a slide goes back to using the desktop
  // one at every width.
  async function removeMobilePoster(slideId) {
    setUploadingKey(`${slideId}:mobile`);
    try {
      await api.delete(`/content/${slideId}/media`, undefined, { variant: "mobile" });
      toast.success("Mobile poster removed");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not remove");
    } finally {
      setUploadingKey(null);
    }
  }

  async function toggleActive(slide) {
    setBusy(true);
    try {
      await api.patch(`/content/${slide._id}`, { isActive: !slide.isActive });
      toast.success(slide.isActive ? "Slide hidden" : "Slide is live");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not update");
    } finally {
      setBusy(false);
    }
  }

  async function move(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    setBusy(true);
    try {
      // Only the two that swapped need writing.
      await Promise.all([
        api.patch(`/content/${slides[index]._id}`, { sortOrder: target }),
        api.patch(`/content/${slides[target]._id}`, { sortOrder: index }),
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
      toast.success("Slide deleted");
      setConfirmDelete(null);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  const liveCount = slides.filter((s) => s.isActive && s.media?.url).length;

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-body text-lg font-semibold text-ink">Homepage hero slider</h2>
            <p className="mt-1 max-w-2xl font-body text-sm text-ink/55">
              The full-width carousel at the top of the shop. Slides rotate every few seconds in the order below.
              {liveCount === 0 && " Nothing is live yet, so the built-in slides are showing."}
            </p>
          </div>
          <Button size="sm" onClick={() => open()}>
            + New Slide
          </Button>
        </div>
      </Card>

      {loading && !data ? (
        <Skeleton className="h-80 w-full" />
      ) : slides.length === 0 ? (
        <Card>
          <EmptyState
            title="No slides yet"
            description="Add your first slide, upload a poster, and it replaces the built-in ones straight away."
          />
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {slides.map((slide, i) => (
            <SlideCard
              key={slide._id}
              slide={slide}
              index={i}
              total={slides.length}
              busy={busy}
              uploadingDesktop={uploadingKey === `${slide._id}:desktop`}
              uploadingMobile={uploadingKey === `${slide._id}:mobile`}
              onUpload={(file) => upload(slide._id, file, "desktop")}
              onUploadMobile={(file) => upload(slide._id, file, "mobile")}
              onRemoveMobile={() => removeMobilePoster(slide._id)}
              onEdit={() => open(slide)}
              onToggle={() => toggleActive(slide)}
              onDelete={() => setConfirmDelete(slide)}
              onUp={() => move(i, -1)}
              onDown={() => move(i, 1)}
            />
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit slide" : "New slide"}
        width="max-w-2xl"
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
          <Field label="Eyebrow">
            <Input
              value={form.eyebrow}
              onChange={(e) => setForm((f) => ({ ...f, eyebrow: e.target.value }))}
              placeholder="Mini Edit"
              maxLength={60}
            />
            <p className="mt-1 font-body text-xs text-ink/40">The small gold line above the headline.</p>
          </Field>

          <Field label="Headline">
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Little Looks, Big Style"
            />
          </Field>

          <Field label="Description">
            <Textarea
              rows={2}
              value={form.subtitle}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
              placeholder="Playful, comfortable fashion for your little one."
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Button 1 text">
              <Input
                value={form.ctaLabel}
                onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
                placeholder="Shop Girls"
              />
            </Field>
            <Field label="Button 1 link">
              <Input
                value={form.ctaHref}
                onChange={(e) => setForm((f) => ({ ...f, ctaHref: e.target.value }))}
                placeholder="/category/girls"
              />
            </Field>
            <Field label="Button 2 text (optional)">
              <Input
                value={form.ctaLabel2}
                onChange={(e) => setForm((f) => ({ ...f, ctaLabel2: e.target.value }))}
                placeholder="Shop Accessories"
              />
            </Field>
            <Field label="Button 2 link">
              <Input
                value={form.ctaHref2}
                onChange={(e) => setForm((f) => ({ ...f, ctaHref2: e.target.value }))}
                placeholder="/category/accessories"
              />
            </Field>
          </div>
          <p className="-mt-2 font-body text-xs text-ink/40">
            Leave a button&apos;s text empty to hide it. Links are paths on your shop, like{" "}
            <code>/category/dresses</code>.
          </p>

          <Field label="Image framing">
            <Select
              value={form.imagePosition}
              onChange={(e) => setForm((f) => ({ ...f, imagePosition: e.target.value }))}
            >
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
            <p className="mt-1 font-body text-xs text-ink/40">
              The text sits on the left, so a subject on the right stays clear of it.
            </p>
          </Field>

          <Field label="Mobile framing">
            <Select
              value={form.imagePositionMobile}
              onChange={(e) => setForm((f) => ({ ...f, imagePositionMobile: e.target.value }))}
            >
              <option value="">Same as desktop</option>
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
            <p className="mt-1 font-body text-xs text-ink/40">
              Only used when a mobile poster has been uploaded for this slide.
            </p>
          </Field>

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4 accent-stitch"
            />
            <span className="font-body text-sm text-ink">Show this slide on the shop</span>
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
        title="Delete this slide?"
        description="The slide and its uploaded poster are removed permanently."
        confirmLabel="Delete"
      />
    </div>
  );
}

function SlideCard({
  slide,
  index,
  total,
  busy,
  uploadingDesktop,
  uploadingMobile,
  onUpload,
  onUploadMobile,
  onRemoveMobile,
  onEdit,
  onToggle,
  onDelete,
  onUp,
  onDown,
}) {
  const fileRef = useRef(null);
  const mobileFileRef = useRef(null);
  const hasImage = Boolean(slide.media?.url);
  const hasMobileImage = Boolean(slide.mediaMobile?.url);
  // Only the desktop poster decides whether a slide can show — the mobile one
  // is an optional override, never a requirement.
  const live = slide.isActive && hasImage;

  return (
    <li>
      <Card padded={false}>
        <div className="flex flex-col gap-4 p-4 md:flex-row">
          {/* Both posters, each at the shape it will actually be seen in, so
              the framing choices can be judged side by side. */}
          <div className="flex w-full shrink-0 gap-3 md:w-auto">
            <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl bg-surface-sunken md:w-72 md:flex-none">
              <div className="aspect-[16/9]">
                {hasImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slide.media.url}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ objectPosition: slide.imagePosition || "center" }}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-1 px-2 text-center">
                    <span className="font-body text-sm text-ink/45">No poster yet</span>
                    <span className="font-body text-xs text-ink/35">This slide won&apos;t show until one is added</span>
                  </div>
                )}
              </div>

              <span className="absolute left-2 top-2 rounded bg-ink/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-paper">
                Desktop
              </span>

              <input
                id={`upload-${slide._id}`}
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  onUpload(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                loading={uploadingDesktop}
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-2 left-2"
              >
                {hasImage ? "Replace poster" : "Upload poster"}
              </Button>
            </div>

            {/* Portrait, because that is the shape it has to work in. */}
            <div className="relative w-28 shrink-0 overflow-hidden rounded-xl bg-surface-sunken md:w-36">
              <div className="aspect-[3/4]">
                {hasMobileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slide.mediaMobile.url}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ objectPosition: slide.imagePositionMobile || slide.imagePosition || "center" }}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-1 px-2 text-center">
                    <span className="font-body text-xs text-ink/45">No mobile poster</span>
                    <span className="font-body text-[11px] text-ink/35">Desktop one is used</span>
                  </div>
                )}
              </div>

              <span className="absolute left-2 top-2 rounded bg-ink/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-paper">
                Mobile
              </span>

              {hasMobileImage && (
                <button
                  type="button"
                  onClick={onRemoveMobile}
                  disabled={uploadingMobile}
                  className="absolute right-2 top-2 rounded bg-ink/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-paper hover:bg-danger disabled:opacity-50"
                >
                  Remove
                </button>
              )}

              <input
                ref={mobileFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  onUploadMobile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                loading={uploadingMobile}
                onClick={() => mobileFileRef.current?.click()}
                className="absolute inset-x-2 bottom-2 justify-center"
              >
                {hasMobileImage ? "Replace" : "Upload"}
              </Button>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10.5px] uppercase tracking-wide text-ink/40">Slide {index + 1}</span>
              {live ? <Badge tone="success">live</Badge> : <Badge tone="neutral">not showing</Badge>}
            </div>

            {slide.eyebrow && (
              <p className="mt-2 font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
                ✦ {slide.eyebrow}
              </p>
            )}
            <p className="mt-1 font-serif text-xl text-ink">{slide.title || "Untitled slide"}</p>
            {slide.subtitle && <p className="mt-1 font-body text-sm text-ink/55">{slide.subtitle}</p>}

            <div className="mt-3 flex flex-wrap gap-2">
              {slide.ctaLabel && (
                <span className="rounded-full bg-ink px-3 py-1 font-body text-[10px] font-semibold uppercase tracking-wide text-paper">
                  {slide.ctaLabel}
                </span>
              )}
              {slide.ctaLabel2 && (
                <span className="rounded-full border border-line-paper px-3 py-1 font-body text-[10px] font-semibold uppercase tracking-wide text-ink/70">
                  {slide.ctaLabel2}
                </span>
              )}
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
              <Button size="sm" variant="secondary" onClick={onEdit}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={onToggle} disabled={busy}>
                {slide.isActive ? "Hide" : "Show"}
              </Button>
              <Button size="sm" variant="ghost" onClick={onUp} disabled={busy || index === 0}>
                ↑
              </Button>
              <Button size="sm" variant="ghost" onClick={onDown} disabled={busy || index === total - 1}>
                ↓
              </Button>
              <Button size="sm" variant="ghost" onClick={onDelete} disabled={busy}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </li>
  );
}
