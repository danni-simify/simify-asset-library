"use client";

import { useState } from "react";
import { Asset } from "@/lib/types";
import Modal from "./Modal";

// Phase 3: this form POSTs to the n8n webhook, which generates a style-matched
// variant and saves it back as a "needs-review" asset. Until N8N_GENERATE_WEBHOOK_URL
// is wired up, Generate is disabled and explains the workflow.
export default function GenerateModal({
  base,
  onClose,
}: {
  base: Asset | null;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Simify line icons (2px stroke, rounded)");

  return (
    <Modal onClose={onClose}>
      <h3>✨ Generate a style-matched variant</h3>
      {base && (
        <>
          <div className="preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={base.file_url} alt={base.name} />
          </div>
          <div className="kv">
            Reference: <b>{base.name}</b>
          </div>
        </>
      )}
      <label htmlFor="gPrompt">Describe what you need</label>
      <textarea
        id="gPrompt"
        rows={3}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. a roaming/data-usage icon in the same line style"
      />
      <label htmlFor="gStyle">Match style of</label>
      <select id="gStyle" value={style} onChange={(e) => setStyle(e.target.value)}>
        <option>Simify line icons (2px stroke, rounded)</option>
        <option>Filled brand graphics</option>
        <option>Photographic / lifestyle</option>
      </select>
      <div className="note" style={{ marginTop: 14 }}>
        <b>Coming in Phase 3.</b> This form will call the n8n builder workflow with your
        brand style spec + this reference asset, so output matches automatically. Icons
        are generated as clean SVG, graphics/images as PNG. Generated assets land in a{" "}
        <b>needs-review</b> state before going public.
      </div>
      <div className="row">
        <button className="btn" disabled title="Wire up the n8n webhook to enable">
          Generate (not yet wired)
        </button>
      </div>
    </Modal>
  );
}
