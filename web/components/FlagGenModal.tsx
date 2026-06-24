"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";

// Generates flags for missing countries — a rectangular AND a circular version
// of each selected country — into the review queue.
export default function FlagGenModal({
  onClose,
  onChanged,
}: {
  onClose: () => void;
  onChanged: () => void;
}) {
  const [missing, setMissing] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/assets/missing-flags")
      .then((r) => r.json())
      .then((d) => setMissing(d.ok ? d.missing : []))
      .catch(() => setError("Couldn't load the missing-country list."));
  }, []);

  function toggle(country: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(country)) next.delete(country);
      else next.add(country);
      return next;
    });
  }

  async function generate() {
    const countries = [...selected];
    if (countries.length === 0) {
      setError("Pick at least one country.");
      return;
    }
    setError("");
    setBusy(true);
    let done = 0;
    let failed = 0;
    try {
      for (const country of countries) {
        for (const shape of ["rectangle", "circular"] as const) {
          setStatus(`Generating ${country} (${shape})… ${done}/${countries.length * 2} done`);
          try {
            const res = await fetch("/api/assets/generate-flag", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ country, shape }),
            });
            const data = await res.json();
            if (data.ok) done++;
            else failed++;
          } catch {
            failed++;
          }
        }
      }
      setStatus(
        `Done — ${done} flag${done !== 1 ? "s" : ""} sent to the review queue${
          failed ? `, ${failed} failed` : ""
        }. Open “Review queue” to approve them.`
      );
      setSelected(new Set());
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3>🏴 Generate missing flags</h3>
      <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
        Pick countries you don&apos;t have yet. Each makes a <b>rectangular</b> and a{" "}
        <b>circular</b> flag, styled from your existing ones, into the review queue.
      </p>
      <div className="note" style={{ marginTop: 4 }}>
        Heads up: simple flags come out accurate; complex ones (stars, emblems, coats of arms) can
        be rough — approve/reject each in the review queue. Generating costs a few cents each and
        takes a few seconds per flag, so do a handful at a time.
      </div>

      {missing === null ? (
        <div className="empty">Loading…</div>
      ) : missing.length === 0 ? (
        <div className="empty">You have a flag for every country. 🎉</div>
      ) : (
        <>
          <div className="kv" style={{ marginTop: 12 }}>
            <b>{missing.length}</b> countries missing · <b>{selected.size}</b> selected
          </div>
          <div
            className="chips"
            style={{ marginLeft: 0, maxHeight: 220, overflow: "auto", marginTop: 8 }}
          >
            {missing.map((c) => (
              <button
                key={c}
                className={"chip" + (selected.has(c) ? " active" : "")}
                onClick={() => toggle(c)}
                disabled={busy}
              >
                {c}
              </button>
            ))}
          </div>
        </>
      )}

      {status && (
        <div className="kv" style={{ marginTop: 10 }}>
          {status}
        </div>
      )}
      <div className="error">{error}</div>

      <div className="row">
        <button
          className="btn"
          onClick={generate}
          disabled={busy || (missing?.length ?? 0) === 0}
        >
          {busy ? "Generating…" : `Generate ${selected.size || ""}`.trim()}
        </button>
        <button className="btn ghost" onClick={onClose} disabled={busy}>
          Close
        </button>
      </div>
    </Modal>
  );
}
