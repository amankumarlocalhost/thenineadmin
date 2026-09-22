"use client";

// Category → Subcategory filter for the Products/Inventory tables.
//
// Mirrors CategoryPicker's tree shape but for filtering, not editing: pick a
// category to see everything filed under it (products are filed under both
// their subcategory and its parent, so a parent-only pick already includes
// the children), or narrow further to one subcategory.
import { useCallback, useMemo } from "react";
import { useFetch } from "@/lib/useFetch";
import { api } from "@/lib/api";
import { Select } from "@/components/ui/Field";

export function CategoryFilter({ value, onChange }) {
  const fetchTree = useCallback(() => api.get("/categories/tree").then((r) => r.data.items), []);
  const { data: tree } = useFetch(fetchTree, [fetchTree]);

  const roots = useMemo(() => tree || [], [tree]);
  const fileable = useMemo(() => roots.filter((c) => c.kind !== "structural"), [roots]);

  // Figure out which parent (if any) `value` belongs under, so a filter set
  // to a subcategory still shows the right parent selected rather than
  // "All categories" — derived from `value` on every render instead of
  // synced into its own state, so there's nothing to keep in sync.
  const parentOf = useMemo(() => {
    const map = new Map();
    fileable.forEach((c) => {
      map.set(c.slug, c.slug);
      c.children.forEach((child) => map.set(child.slug, c.slug));
    });
    return map;
  }, [fileable]);

  const parentSlug = value ? parentOf.get(value) || "" : "";
  const selectedParent = fileable.find((c) => c.slug === parentSlug) || null;
  const childSlug = value && value !== parentSlug ? value : "";

  return (
    <>
      <Select
        value={parentSlug}
        onChange={(e) => onChange(e.target.value)}
        className="w-44"
      >
        <option value="">All categories</option>
        {fileable.map((c) => (
          <option key={c._id} value={c.slug}>
            {c.label}
          </option>
        ))}
      </Select>

      <Select
        value={childSlug}
        onChange={(e) => onChange(e.target.value || parentSlug)}
        disabled={!selectedParent || selectedParent.children.length === 0}
        className="w-44"
      >
        <option value="">{selectedParent ? "All subcategories" : "Pick a category first"}</option>
        {selectedParent?.children.map((c) => (
          <option key={c._id} value={c.slug}>
            {c.label}
          </option>
        ))}
      </Select>
    </>
  );
}
