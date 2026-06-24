import { getAssets } from "@/lib/assets";
import Gallery from "@/components/Gallery";

export default function Home() {
  const assets = getAssets();
  return <Gallery assets={assets} />;
}
