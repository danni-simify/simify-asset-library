"use client";

import { useState } from "react";
import { Asset } from "@/lib/types";
import Modal from "./Modal";

// Generates a style-matched SVG icon via Claude. Result lands in the review
// queue (needs-review) — a designer approves it before it goes public.
export default function GenerateModal({
  base,
  onClose,
}: {
  base: Asset | null;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Asset | null>(null);

  async function generate() {
    setError("");
    if (!prompt.trim()) {
      setError("Describe the icon you need.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/assets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, baseId: base?.id }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Generation failed.");
        return;
      }
      setResult(data.asset);
    } catch {
      setError("Generation failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3>✨ Generate a style-matched icon</h3>

      {result ? (
        <>
          <div className="preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.file_url} alt={result.name} />
          </div>
          <div className="note">
            <b>Done — “{result.name}” is in the review queue.</b> It won&apos;t appear in the
            library until someone approves it. Open <b>Review queue</b> on the main screen to
            publish or discard it.
          </div>
          <div className="row">
            <button
              className="btn ghost"
              onClick={() => {
                setResult(null);
                setPrompt("");
              }}
            >
              Generate another
            </button>
            <button className="btn" onClick={onClose}>
              Done
            </button>
          </div>
        </>
      ) : (
        <>
          {base && (
            <>
              <div className="preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={base.file_url} alt={base.name} />
              </div>
              <div className="kv">
                Using <b>{base.name}</b> as a style reference.
              </div>
            </>
          )}
          <label htmlFor="gPrompt">Describe what you need</label>
          <textarea
            id="gPrompt"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. a roaming / data-usage icon in the same line style"
          />
          <div className="note" style={{ marginTop: 12 }}>
            Claude writes a clean SVG matched to Simify&apos;s line style, using your existing
            icons as references. It saves to the <b>review queue</b> — nothing goes public until
            approved.
          </div>
          <div className="error">{error}</div>
          <div className="row">
            <button className="btn" onClick={generate} disabled={loading}>
              {loading ? "Generating…" : "Generate icon"}
            </button>
            <button className="btn ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
