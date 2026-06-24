"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Asset, AssetType } from "@/lib/types";
import AssetModal from "./AssetModal";
import AddModal from "./AddModal";
import GenerateModal from "./GenerateModal";
import ReviewModal from "./ReviewModal";
import FlagGenModal from "./FlagGenModal";

type ShapeFilter = "all" | "rectangle" | "circular";

type TypeFilter = AssetType | "all";

const TABS: { label: string; value: TypeFilter }[] = [
  { label: "All", value: "all" },
  { label: "Icons", value: "icon" },
  { label: "Graphics", value: "graphic" },
  { label: "Images", value: "image" },
  { label: "Flags", value: "flag" },
];

export default function Gallery({ assets }: { assets: Asset[] }) {
  const router = useRouter();

  const [filterType, setFilterType] = useState<TypeFilter>("all");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [detail, setDetail] = useState<Asset | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showFlagGen, setShowFlagGen] = useState(false);
  const [shapeFilter, setShapeFilter] = useState<ShapeFilter>("all");
  const [sorting, setSorting] = useState(false);
  const [generateBase, setGenerateBase] = useState<Asset | null | undefined>(undefined);

  // Batch selection
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const allTags = useMemo(() => {
    const t = new Set<string>();
    assets.forEach((a) => a.tags.forEach((x) => t.add(x)));
    return [...t].sort();
  }, [assets]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => {
      if (filterType !== "all" && a.type !== filterType) return false;
      if (filterType === "flag" && shapeFilter !== "all" && !a.tags.includes(shapeFilter))
        return false;
      if (filterTag && !a.tags.includes(filterTag)) return false;
      if (q) {
        const haystack = (a.name + " " + a.tags.join(" ")).toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [assets, filterType, filterTag, query, shapeFilter]);

  async function sortFlags() {
    setSorting(true);
    try {
      const res = await fetch("/api/assets/sort-flags", { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        alert(data.error || "Sort failed.");
        return;
      }
      alert(
        data.moved > 0
          ? `Moved ${data.moved} flag${data.moved !== 1 ? "s" : ""} into Flags.`
          : "No flags found in Graphics to move."
      );
      router.refresh();
    } catch {
      alert("Sort failed. Try again.");
    } finally {
      setSorting(false);
    }
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelect() {
    setSelectMode(false);
    setSelected(new Set());
  }

  function selectAllVisible() {
    setSelected(new Set(visible.map((a) => a.id)));
  }

  async function deleteIds(ids: string[]) {
    if (ids.length === 0) return;
    const label = ids.length === 1 ? "this asset" : `${ids.length} assets`;
    if (!confirm(`Delete ${label}? This can't be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/assets/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(data.error || "Delete failed.");
        return;
      }
      setDetail(null);
      exitSelect();
      router.refresh();
    } catch {
      alert("Delete failed. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  function onCardClick(a: Asset) {
    if (selectMode) toggleSelected(a.id);
    else setDetail(a);
  }

  return (
    <>
      <header>
        <div className="bar">
          <div className="logo">
            <span className="dot">S</span> Simify Asset Library
          </div>
          <div className="search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or tag…"
            />
          </div>
          <button className="btn ghost" onClick={() => setShowReview(true)}>
            ✓ Review queue
          </button>
          <button className="btn ghost" onClick={() => setGenerateBase(null)}>
            ✨ Generate variant
          </button>
          <button className="btn" onClick={() => setShowAdd(true)}>
            ＋ Add assets
          </button>
        </div>
      </header>

      <main>
        <div className="toolbar">
          <div className="tabs">
            {TABS.map((t) => (
              <button
                key={t.value}
                className={"tab" + (filterType === t.value ? " active" : "")}
                onClick={() => setFilterType(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="chips">
            {allTags.map((tag) => (
              <button
                key={tag}
                className={"chip" + (filterTag === tag ? " active" : "")}
                onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Flag-specific toolbar */}
        {filterType === "flag" && (
          <div className="selbar">
            <div className="tabs">
              {(["all", "rectangle", "circular"] as ShapeFilter[]).map((s) => (
                <button
                  key={s}
                  className={"tab" + (shapeFilter === s ? " active" : "")}
                  onClick={() => setShapeFilter(s)}
                >
                  {s === "all" ? "All shapes" : s === "rectangle" ? "Rectangle" : "Circular"}
                </button>
              ))}
            </div>
            <button className="btn ghost sm" onClick={sortFlags} disabled={sorting}>
              {sorting ? "Sorting…" : "⤧ Sort flags from Graphics"}
            </button>
            <button className="btn ghost sm" onClick={() => setShowFlagGen(true)}>
              🏴 Generate missing flags
            </button>
          </div>
        )}

        {/* Selection / batch toolbar */}
        <div className="selbar">
          {!selectMode ? (
            <button className="btn ghost sm" onClick={() => setSelectMode(true)} disabled={assets.length === 0}>
              ☑ Select
            </button>
          ) : (
            <>
              <span className="count" style={{ margin: 0 }}>
                {selected.size} selected
              </span>
              <button className="btn ghost sm" onClick={selectAllVisible}>
                Select all ({visible.length})
              </button>
              <button
                className="btn danger sm"
                onClick={() => deleteIds([...selected])}
                disabled={selected.size === 0 || deleting}
              >
                {deleting ? "Deleting…" : `🗑 Delete selected`}
              </button>
              <button className="btn ghost sm" onClick={exitSelect} disabled={deleting}>
                Cancel
              </button>
            </>
          )}
          <span className="count" style={{ marginLeft: "auto", marginBottom: 0 }}>
            {visible.length} asset{visible.length !== 1 ? "s" : ""}
          </span>
        </div>

        {visible.length === 0 ? (
          <div className="empty">
            {assets.length === 0
              ? "No assets yet. Click “Add assets” to upload your first icons."
              : "No assets match. Try a different search."}
          </div>
        ) : (
          <div className="grid">
            {visible.map((a) => {
              const isSel = selected.has(a.id);
              return (
                <div
                  key={a.id}
                  className={"card" + (selectMode ? " selectable" : "") + (isSel ? " selected" : "")}
                  onClick={() => onCardClick(a)}
                >
                  {selectMode && <span className="check">{isSel ? "✓" : ""}</span>}
                  <div className="thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.file_url} alt={a.name} />
                  </div>
                  <div className="meta">
                    <div className="name">{a.name}</div>
                    <div className="sub">
                      <span className={"badge " + a.type}>{a.type}</span>
                    </div>
                    <div className="tags">{a.tags.map((t) => "#" + t).join(" ")}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {detail && (
        <AssetModal
          asset={detail}
          onClose={() => setDetail(null)}
          onDelete={(a) => deleteIds([a.id])}
          onGenerateVariant={(a) => {
            setDetail(null);
            setGenerateBase(a);
          }}
        />
      )}
      {showAdd && (
        <AddModal
          onClose={() => setShowAdd(false)}
          onUploaded={() => {
            setShowAdd(false);
            router.refresh();
          }}
        />
      )}
      {generateBase !== undefined && (
        <GenerateModal base={generateBase} onClose={() => setGenerateBase(undefined)} />
      )}
      {showReview && (
        <ReviewModal onClose={() => setShowReview(false)} onChanged={() => router.refresh()} />
      )}
      {showFlagGen && (
        <FlagGenModal onClose={() => setShowFlagGen(false)} onChanged={() => router.refresh()} />
      )}
    </>
  );
}
