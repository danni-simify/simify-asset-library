// The asset data model. Mirrors docs/PLAN.md. When we later move files/metadata
// into Supabase, this shape stays the same — only the loader changes.

export type AssetType = "icon" | "graphic" | "image" | "flag";
export type AssetSource = "uploaded" | "generated";
export type AssetStatus = "published" | "needs-review";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  tags: string[];
  file_url: string; // path under /public, e.g. /assets/globe.svg
  format: string; // svg | png | jpg
  width: number | null;
  height: number | null;
  uploaded_by: string;
  created_at: string; // ISO timestamp
  source: AssetSource;
  status: AssetStatus;
  parent_id: string | null; // set when this is a variant of another asset
}
