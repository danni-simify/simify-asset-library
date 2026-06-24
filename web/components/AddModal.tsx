"use client";

import Modal from "./Modal";

// In the assets-in-repo model, adding is done by dropping files into a folder
// and running the ingest script, then deploying. This modal documents that flow.
// When we later add Supabase, this becomes a real in-browser upload form.
export default function AddModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <h3>＋ Add assets to the library</h3>
      <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
        Assets live in the repo, so adding them is a quick three-step flow:
      </p>
      <ol style={{ fontSize: 14, lineHeight: 1.7, paddingLeft: 20 }}>
        <li>
          Drop your files into <code>web/public/assets/</code> (SVG for icons, PNG/JPG
          for graphics &amp; images).
        </li>
        <li>
          Run <code>npm run ingest</code> — this registers every new file, guesses its
          type and tags from the filename, and updates the library.
        </li>
        <li>
          Edit names/tags in <code>web/data/assets.json</code> if you want, commit, and
          push. Vercel redeploys automatically.
        </li>
      </ol>
      <div className="note">
        <b>Why a script and not an upload button?</b> You chose the simplest hosting
        (assets in the repo, no Supabase). That means anyone who can push can add assets,
        with zero accounts to manage. If you later want non-technical teammates to upload
        in-browser, we swap the file loader for Supabase Storage — the gallery UI doesn&apos;t
        change.
      </div>
      <div className="row">
        <button className="btn" onClick={onClose}>
          Got it
        </button>
      </div>
    </Modal>
  );
}
