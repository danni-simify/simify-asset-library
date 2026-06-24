"use client";

import { Asset } from "@/lib/types";
import Modal from "./Modal";

export default function AssetModal({
  asset,
  onClose,
  onDelete,
  onGenerateVariant,
}: {
  asset: Asset;
  onClose: () => void;
  onDelete: (a: Asset) => void;
  onGenerateVariant: (a: Asset) => void;
}) {
  const downloadName =
    asset.name.replace(/\s+/g, "-").toLowerCase() + "." + asset.format;

  return (
    <Modal onClose={onClose}>
      <h3>{asset.name}</h3>
      <div className="preview">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset.file_url} alt={asset.name} />
      </div>
      <div className="kv">
        <b>Type:</b> {asset.type}
      </div>
      <div className="kv">
        <b>Format:</b> {asset.format.toUpperCase()}
        {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""}
      </div>
      <div className="kv">
        <b>Tags:</b> {asset.tags.map((t) => "#" + t).join(" ") || "—"}
      </div>
      <div className="kv">
        <b>Source:</b> {asset.source}
      </div>
      <div className="row">
        <a className="btn" href={asset.file_url} download={downloadName}>
          ⬇ Download
        </a>
        <button className="btn ghost" onClick={() => onGenerateVariant(asset)}>
          ✨ Generate variant
        </button>
        <button className="btn danger" onClick={() => onDelete(asset)}>
          🗑 Delete
        </button>
      </div>
    </Modal>
  );
}
