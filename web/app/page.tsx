import { getAssets } from "@/lib/assets";
import Gallery from "@/components/Gallery";

// Always render fresh so newly uploaded/deleted assets show immediately.
export const dynamic = "force-dynamic";

export default async function Home() {
  const assets = await getAssets();
  return <Gallery assets={assets} />;
}
