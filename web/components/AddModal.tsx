"use client";

import { useState } from "react";
import Modal from "./Modal";

type Override = { name?: string; tags?: string[] };
type Decision = { filename: string; keep: boolean; name: string; tags: string[] };

// Real in-site upload. Supports one or many files at once (batch upload).
// Optional AI note: Claude filters/renames the batch before upload
// (e.g. "only one flag per country").
export default function AddModal({
  onClose,
  onUploaded,
}: {
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [type, setType] = useState(""); // "" = auto
  const [tags, setTags] = useState("");
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function upload() {
    setError("");
    setStatus("");
    if (files.length === 0) {
      setError("Choose at least one file.");
      return;
    }
    setUploading(true);
    try {
      let toUpload = files;
      let overrides: Record<string, Override> | null = null;

      // Step 1 — if a note is given, let Claude decide which files to keep.
      if (note.trim()) {
        setStatus("Asking AI to review the batch…");
        const planRes = await fetch("/api/assets/plan-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note, files: files.map((f) => f.name) }),
        });
        const plan = await planRes.json();
        if (!plan.ok) {
          setError(plan.error || "AI review failed.");
          return;
        }
        const byName = new Map<string, Decision>(
          (plan.decisions as Decision[]).map((d) => [d.filename, d])
        );
        toUpload = files.filter((f) => byName.get(f.name)?.keep);
        overrides = {};
        for (const f of toUpload) {
          const d = byName.get(f.name);
          if (d) overrides[f.name] = { name: d.name, tags: d.tags };
        }
        if (toUpload.length === 0) {
          setError("AI didn't select any files to keep. Try rephrasing your note.");
          return;
        }
        setStatus(`AI kept ${toUpload.length} of ${files.length} files. Uploading…`);
      } else {
        setStatus("Uploading…");
      }

      // Step 2 — upload the kept files.
      const fd = new FormData();
      toUpload.forEach((f) => fd.append("files", f));
      fd.append("type", type);
      fd.append("tags", tags);
      if (overrides) fd.append("overrides", JSON.stringify(overrides));

      const res = await fetch("/api/assets/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Upload failed.");
        return;
      }
      onUploaded();
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3>＋ Add assets</h3>
      <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
        Upload one file or many at once. SVG for icons &amp; flags; PNG/JPG for graphics &amp; images.
      </p>

      <label htmlFor="files">Files</label>
      <input
        id="files"
        type="file"
        accept="image/*,.svg"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
      />
      {files.length > 0 && (
        <div className="kv" style={{ marginTop: 8 }}>
          <b>{files.length}</b> file{files.length !== 1 ? "s" : ""} selected
        </div>
      )}

      <label htmlFor="type">Type</label>
      <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
        <option value="">Auto (icon for SVG, graphic otherwise)</option>
        <option value="icon">Icon</option>
        <option value="flag">Flag</option>
        <option value="graphic">Graphic</option>
        <option value="image">Image</option>
      </select>

      <label htmlFor="tags">Tags (comma separated, applied to all)</label>
      <input
        id="tags"
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="travel, coverage"
      />

      <label htmlFor="note">Notes for AI (optional)</label>
      <textarea
        id="note"
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="e.g. these are country flags with duplicates — keep only one per country"
      />
      <div className="note" style={{ marginTop: 8 }}>
        Leave blank to upload everything as-is. If you add a note, Claude reviews the batch first
        (by filename) and uploads only the files that match — naming and tagging each one for you.
      </div>

      {status && (
        <div className="kv" style={{ marginTop: 10 }}>
          {status}
        </div>
      )}
      <div className="error">{error}</div>

      <div className="row">
        <button className="btn" onClick={upload} disabled={uploading}>
          {uploading ? "Working…" : note.trim() ? "Review & upload" : `Upload ${files.length || ""}`.trim()}
        </button>
        <button className="btn ghost" onClick={onClose} disabled={uploading}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
