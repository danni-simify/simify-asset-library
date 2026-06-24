"use client";

import { useState } from "react";
import Modal from "./Modal";

// Real in-site upload. Supports one or many files at once (batch upload).
// Type/tags apply to the whole batch; "Auto" infers icon for SVG, graphic otherwise.
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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload() {
    setError("");
    if (files.length === 0) {
      setError("Choose at least one file.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      fd.append("type", type);
      fd.append("tags", tags);
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
        Upload one file or many at once. SVG for icons; PNG/JPG for graphics &amp; images.
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

      <div className="error">{error}</div>

      <div className="row">
        <button className="btn" onClick={upload} disabled={uploading}>
          {uploading ? "Uploading…" : `Upload ${files.length || ""}`.trim()}
        </button>
        <button className="btn ghost" onClick={onClose} disabled={uploading}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
