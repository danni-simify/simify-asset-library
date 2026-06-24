"use client";

import { useMemo, useState } from "react";
import { Asset, AssetType } from "@/lib/types";
import AssetModal from "./AssetModal";
import AddModal from "./AddModal";
import GenerateModal from "./GenerateModal";

type TypeFilter = AssetType | "all";

const TABS: { label: string; value: TypeFilter }[] = [
  { label: "All", value: "all" },
  { label: "Icons", value: "icon" },
  { label: "Graphics", value: "graphic" },
  { label: "Images", value: "image" },
];

export default function Gallery({ assets }: { assets: Asset[] }) {
  const [filterType, setFilterType] = useState<TypeFilter>("all");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [detail, setDetail] = useState<Asset | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [generateBase, setGenerateBase] = useState<Asset | null | undefined>(undefined);
  // undefined = closed, null = open with no base, Asset = open with a reference

  const allTags = useMemo(() => {
    const t = new Set<string>();
    assets.forEach((a) => a.tags.forEach((x) => t.add(x)));
    return [...t].sort();
  }, [assets]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => {
      if (filterType !== "all" && a.type !== filterType) return false;
      if (filterTag && !a.tags.includes(filterTag)) return false;
      if (q) {
        const haystack = (a.name + " " + a.tags.join(" ")).toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [assets, filterType, filterTag, query]);

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
          <button className="btn ghost" onClick={() => setGenerateBase(null)}>
            ✨ Generate variant
          </button>
          <button className="btn" onClick={() => setShowAdd(true)}>
            ＋ Add asset
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

        <div className="count">
          {visible.length} asset{visible.length !== 1 ? "s" : ""}
        </div>

        {visible.length === 0 ? (
          <div className="empty">No assets match. Try a different search, or add one.</div>
        ) : (
          <div className="grid">
            {visible.map((a) => (
              <div key={a.id} className="card" onClick={() => setDetail(a)}>
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
            ))}
          </div>
        )}
      </main>

      {detail && (
        <AssetModal
          asset={detail}
          onClose={() => setDetail(null)}
          onGenerateVariant={(a) => {
            setDetail(null);
            setGenerateBase(a);
          }}
        />
      )}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} />}
      {generateBase !== undefined && (
        <GenerateModal base={generateBase} onClose={() => setGenerateBase(undefined)} />
      )}
    </>
  );
}
