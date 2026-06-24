"use client";

import { useEffect, useState } from "react";
import { Asset } from "@/lib/types";
import Modal from "./Modal";

// The "needs-review" queue — approve generated icons into the library, or discard them.
export default function ReviewModal({
  onClose,
  onChanged,
}: {
  onClose: () => void;
  onChanged: () => void;
}) {
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const res = await fetch("/api/assets/review");
      const data = await res.json();
      if (data.ok) setAssets(data.assets);
      else setError(data.error || "Couldn't load the queue.");
    } catch {
      setError("Couldn't load the queue.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function act(asset: Asset, action: "approve" | "reject") {
    setBusyId(asset.id);
    setError("");
    try {
      const url = action === "approve" ? "/api/assets/approve" : "/api/assets/delete";
      const body = action === "approve" ? { id: asset.id } : { ids: [asset.id] };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Action failed.");
        return;
      }
      setAssets((prev) => (prev ? prev.filter((a) => a.id !== asset.id) : prev));
      onChanged();
    } catch {
      setError("Action failed. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3>Review queue</h3>
      <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
        Generated icons waiting for approval. Approve to publish into the library, or discard.
      </p>
      <div className="error">{error}</div>

      {assets === null ? (
        <div className="empty">Loading…</div>
      ) : assets.length === 0 ? (
        <div className="empty">Nothing to review. Generated icons will show up here.</div>
      ) : (
        assets.map((a) => (
          <div
            key={a.id}
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              padding: "12px 0",
              borderTop: "1px solid var(--line)",
            }}
          >
            <div
              className="preview"
              style={{ width: 72, height: 72, minHeight: 0, padding: 10, margin: 0, flex: "0 0 auto" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.file_url} alt={a.name} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="meta" style={{ padding: 0, border: "none" }}>
                <div className="name">{a.name}</div>
                <div className="tags">{a.tags.map((t) => "#" + t).join(" ")}</div>
              </div>
            </div>
            <button className="btn sm" onClick={() => act(a, "approve")} disabled={busyId === a.id}>
              {busyId === a.id ? "…" : "Approve"}
            </button>
            <button
              className="btn ghost sm"
              onClick={() => act(a, "reject")}
              disabled={busyId === a.id}
            >
              Discard
            </button>
          </div>
        ))
      )}
    </Modal>
  );
}
