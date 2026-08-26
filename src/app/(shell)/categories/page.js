"use client";

import { useCallback, useMemo, useState } from "react";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api, ApiClientError } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/EmptyState";

const EMPTY = { slug: "", label: "", description: "", parent: "", sortOrder: 0, showInNav: true };

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CategoriesPage() {
  usePageTitle("Categories");
  const toast = useToast();

  // includeInactive, so a deactivated row is still visible here and can be
  // switched back on — otherwise it would vanish with no way back.
  const fetchTree = useCallback(
    () => api.get("/categories/tree", { includeInactive: "true" }).then((r) => r.data.items),
    []
  );
  const { data: tree, loading, error, reload } = useFetch(fetchTree, [fetchTree]);

  // "categories" | "subcategories" — two separate jobs, so they get two
  // separate screens rather than one form that changes shape depending on
  // which dropdown you touched first.
  const [tab, setTab] = useState("categories");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const categories = useMemo(() => tree || [], [tree]);

  // Subcategories flattened out of the tree, each carrying its parent so the
  // list can show "Girl Dress › Small Top" without a second lookup.
  const subcategories = useMemo(
    () => categories.flatMap((parent) => parent.children.map((child) => ({ ...child, parentCategory: parent }))),
    [categories]
  );

  const isSubcategoryTab = tab === "subcategories";

  function open(category = null) {
    setEditing(category);
    setFormError("");
    setSlugTouched(Boolean(category));
    setForm(
      category
        ? {
            slug: category.slug,
            label: category.label,
            description: category.description || "",
            parent: category.parent ? String(category.parent) : "",
            sortOrder: category.sortOrder,
            showInNav: category.showInNav !== false,
          }
        : EMPTY
    );
    setModalOpen(true);
  }

  // The slug follows the name until it's edited by hand, then it's left alone —
  // a slug is a URL, and silently changing one breaks links already shared.
  function updateLabel(label) {
    setForm((f) => ({ ...f, label, slug: slugTouched ? f.slug : slugify(label) }));
  }

  async function handleSave() {
    setFormError("");
    if (!form.label.trim()) {
      setFormError("Give it a name.");
      return;
    }
    if (isSubcategoryTab && !form.parent) {
      setFormError("Choose which category this belongs to.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        label: form.label.trim(),
        slug: form.slug || slugify(form.label),
        description: form.description,
        sortOrder: Number(form.sortOrder) || 0,
        showInNav: form.showInNav,
        // A subcategory always has a parent; a category never does.
        parent: isSubcategoryTab ? form.parent : null,
      };

      if (editing) {
        await api.patch(`/categories/${editing._id}`, payload);
        toast.success(isSubcategoryTab ? "Subcategory updated" : "Category updated");
      } else {
        await api.post("/categories", payload);
        toast.success(isSubcategoryTab ? "Subcategory created" : "Category created");
      }
      setModalOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(cat) {
    try {
      if (cat.isActive) {
        const res = await api.delete(`/categories/${cat._id}`);
        toast.success(res.message);
      } else {
        await api.patch(`/categories/${cat._id}`, { isActive: true });
        toast.success("Reactivated");
      }
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not update");
    }
  }

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 border-b border-line-paper">
          {[
            { key: "categories", label: `Categories (${categories.length})` },
            { key: "subcategories", label: `Subcategories (${subcategories.length})` },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`relative px-3 pb-2.5 pt-1 font-body text-xs font-medium transition-colors ${
                tab === t.key ? "text-ink" : "text-ink/45 hover:text-ink/70"
              }`}
            >
              {t.label}
              {tab === t.key && <span className="absolute -bottom-px left-0 h-[2px] w-full bg-ink" aria-hidden="true" />}
            </button>
          ))}
        </div>

        <Button size="sm" onClick={() => open()} disabled={isSubcategoryTab && categories.length === 0}>
          {isSubcategoryTab ? "+ New Subcategory" : "+ New Category"}
        </Button>
      </div>

      {tab === "categories" ? (
        <Card title="Categories" padded={false}>
          <p className="border-b border-line-paper px-5 py-3 font-body text-xs text-ink/50">
            The top level of the catalog — Dresses, Girl Dress, Accessories. Add subcategories under these on the
            Subcategories tab.
          </p>

          {loading && !tree ? (
            <Skeleton className="m-5 h-48" />
          ) : categories.length === 0 ? (
            <EmptyState title="No categories yet" description="Create your first category to get started." />
          ) : (
            <ul className="flex flex-col divide-y divide-line-paper">
              {categories.map((cat) => (
                <li key={cat._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-body text-sm font-medium text-ink">{cat.label}</span>
                      <span className="font-mono text-[11px] text-ink/45">{cat.slug}</span>
                      {!cat.isActive && <Badge tone="danger">inactive</Badge>}
                      {cat.isActive && cat.showInNav === false && <Badge tone="neutral">not in menu</Badge>}
                    </div>
                    <p className="mt-0.5 font-body text-xs text-ink/45">
                      {cat.children.length === 0
                        ? "No subcategories"
                        : `${cat.children.length} subcategor${cat.children.length === 1 ? "y" : "ies"}: ${cat.children
                            .map((c) => c.label)
                            .join(", ")}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="secondary" onClick={() => open(cat)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(cat)}>
                      {cat.isActive ? "Deactivate" : "Reactivate"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : (
        <Card title="Subcategories" padded={false}>
          <p className="border-b border-line-paper px-5 py-3 font-body text-xs text-ink/50">
            Name the subcategory and pick which category it sits under. A product filed under a subcategory shows in
            its parent category too.
          </p>

          {loading && !tree ? (
            <Skeleton className="m-5 h-48" />
          ) : categories.length === 0 ? (
            <EmptyState
              title="Create a category first"
              description="A subcategory has to belong to a category, so start on the Categories tab."
            />
          ) : subcategories.length === 0 ? (
            <EmptyState
              title="No subcategories yet"
              description="Add one and choose the category it belongs to."
            />
          ) : (
            <ul className="flex flex-col divide-y divide-line-paper">
              {subcategories.map((sub) => (
                <li key={sub._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-body text-sm text-ink/45">{sub.parentCategory.label}</span>
                      <span className="text-ink/30" aria-hidden="true">
                        ›
                      </span>
                      <span className="font-body text-sm font-medium text-ink">{sub.label}</span>
                      <span className="font-mono text-[11px] text-ink/45">{sub.slug}</span>
                      {!sub.isActive && <Badge tone="danger">inactive</Badge>}
                      {sub.isActive && sub.showInNav === false && <Badge tone="neutral">not in menu</Badge>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="secondary" onClick={() => open(sub)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(sub)}>
                      {sub.isActive ? "Deactivate" : "Reactivate"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editing
            ? `Edit ${editing.label}`
            : isSubcategoryTab
              ? "New Subcategory"
              : "New Category"
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {isSubcategoryTab && (
            <Field label="Category">
              <Select value={form.parent} onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value }))}>
                <option value="">Choose a category…</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label={isSubcategoryTab ? "Subcategory name" : "Category name"}>
            <Input
              value={form.label}
              onChange={(e) => updateLabel(e.target.value)}
              placeholder={isSubcategoryTab ? "Small Top" : "Girl Dress"}
              autoFocus
            />
          </Field>

          <Field label="Slug" error={formError}>
            <Input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((f) => ({ ...f, slug: e.target.value }));
              }}
              placeholder={isSubcategoryTab ? "small-top" : "girl-dress"}
            />
            <p className="mt-1 font-body text-xs text-ink/40">
              The storefront URL. Filled in from the name — change it only if you need to.
            </p>
          </Field>

          <Field label="Description (optional)">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>

          <Field label="Sort order">
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            />
            <p className="mt-1 font-body text-xs text-ink/40">
              Lower numbers come first, both in the menu and in listings.
            </p>
          </Field>

          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={form.showInNav}
              onChange={(e) => setForm((f) => ({ ...f, showInNav: e.target.checked }))}
              className="mt-0.5 h-4 w-4 accent-stitch"
            />
            <span>
              <span className="block font-body text-sm text-ink">Show in the shop menu</span>
              <span className="block font-body text-xs text-ink/45">
                Turn this off to keep the category usable but out of the navbar. It stays browsable by URL and keeps
                its products.
              </span>
            </span>
          </label>
        </div>
      </Modal>
    </div>
  );
}
