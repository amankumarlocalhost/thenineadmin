"use client";

// Category → Subcategory picker for the product form.
//
// You pick a category, then a subcategory under it, then Add — the pair is
// stored as slugs on the product. Structural shelves (New Arrivals, Best
// Sellers) are separate checkboxes below, because they're flags a product
// carries rather than a place it's filed.
import { useCallback, useMemo, useState } from "react";
import { useFetch } from "@/lib/useFetch";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";

export function CategoryPicker({ value = [], onChange }) {
  const fetchTree = useCallback(() => api.get("/categories/tree").then((r) => r.data.items), []);
  const { data: tree, loading } = useFetch(fetchTree, [fetchTree]);

  const [parentId, setParentId] = useState("");
  const [childSlug, setChildSlug] = useState("");

  // Memoized so the empty-while-loading fallback isn't a fresh array on every
  // render, which would make every memo below recompute each time.
  const roots = useMemo(() => tree || [], [tree]);

  // Products are filed under real categories; structural ones are the flags.
  const fileable = useMemo(() => roots.filter((c) => c.kind !== "structural"), [roots]);
  const structural = useMemo(() => roots.filter((c) => c.kind === "structural"), [roots]);

  const selectedParent = fileable.find((c) => c._id === parentId) || null;

  // Slug → readable label, so the chips below read like the category tree
  // rather than like URLs.
  const labelBySlug = useMemo(() => {
    const map = new Map();
    roots.forEach((r) => {
      map.set(r.slug, r.label);
      r.children.forEach((c) => map.set(c.slug, `${r.label} › ${c.label}`));
    });
    return map;
  }, [roots]);

  function add() {
    if (!selectedParent) return;
    // Adding a subcategory brings its parent along — a product in "Small Top"
    // belongs in "Girl Dress" too. The backend enforces this as well; doing it
    // here means the chips show the truth before saving.
    const next = new Set(value);
    next.add(selectedParent.slug);
    if (childSlug) next.add(childSlug);
    onChange([...next]);
    setChildSlug("");
  }

  function remove(slug) {
    onChange(value.filter((s) => s !== slug));
  }

  function toggleStructural(slug) {
    onChange(value.includes(slug) ? value.filter((s) => s !== slug) : [...value, slug]);
  }

  if (loading && !tree) return <p className="font-body text-xs text-ink/45">Loading categories…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Category">
          <Select
            value={parentId}
            onChange={(e) => {
              setParentId(e.target.value);
              setChildSlug("");
            }}
          >
            <option value="">Choose a category…</option>
            {fileable.map((c) => (
              <option key={c._id} value={c._id}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Subcategory">
          <Select
            value={childSlug}
            onChange={(e) => setChildSlug(e.target.value)}
            disabled={!selectedParent || selectedParent.children.length === 0}
          >
            <option value="">
              {!selectedParent
                ? "Pick a category first"
                : selectedParent.children.length === 0
                  ? "No subcategories"
                  : "— Category only —"}
            </option>
            {selectedParent?.children.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>

        <Button type="button" variant="secondary" onClick={add} disabled={!selectedParent}>
          Add
        </Button>
      </div>

      <div>
        <p className="mb-2 font-mono text-[10.5px] uppercase tracking-wide text-ink/45">Filed under</p>
        {value.length === 0 ? (
          <p className="font-body text-xs text-ink/40">Nothing yet — pick a category above and press Add.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {value.map((slug) => (
              <span
                key={slug}
                className="inline-flex items-center gap-1.5 rounded-full border border-line-paper bg-surface px-3 py-1.5"
              >
                <span className="font-body text-xs text-ink">{labelBySlug.get(slug) || slug}</span>
                <button
                  type="button"
                  onClick={() => remove(slug)}
                  aria-label={`Remove ${labelBySlug.get(slug) || slug}`}
                  className="text-ink/35 transition-colors hover:text-danger"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {structural.length > 0 && (
        <div className="border-t border-line-paper pt-3">
          <p className="mb-2 font-mono text-[10.5px] uppercase tracking-wide text-ink/45">Shelves</p>
          <div className="flex flex-wrap gap-3">
            {structural.map((c) => (
              <label key={c._id} className="flex cursor-pointer items-center gap-2 font-body text-sm text-ink">
                <input
                  type="checkbox"
                  checked={value.includes(c.slug)}
                  onChange={() => toggleStructural(c.slug)}
                  className="h-4 w-4 accent-stitch"
                />
                {c.label}
              </label>
            ))}
          </div>
          <p className="mt-2 font-body text-xs text-ink/40">
            Sale is worked out from the original price, so there&apos;s no checkbox for it.
          </p>
        </div>
      )}

      {value.length > 0 && (
        <p className="font-body text-xs text-ink/40">
          Stored as: <Badge tone="neutral">{value.join(", ")}</Badge>
        </p>
      )}
    </div>
  );
}
