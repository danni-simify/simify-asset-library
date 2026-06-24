// Detects whether an SVG flag is rectangular or circular, from its geometry.
// Circular flags are square-ish (≈1:1) and/or clip to a circle; rectangular
// flags are wider than tall (3:2, 2:1, etc.).
export type FlagShape = "rectangle" | "circular";

export function detectSvgShape(svg: string): FlagShape {
  let ratio = 1.5; // default to a typical flag aspect if no viewBox
  const vb = svg.match(/viewBox\s*=\s*["']\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)/i);
  if (vb) {
    const w = parseFloat(vb[1]);
    const h = parseFloat(vb[2]);
    if (h > 0) ratio = w / h;
  } else {
    const w = svg.match(/\bwidth\s*=\s*["']([\d.]+)/i);
    const h = svg.match(/\bheight\s*=\s*["']([\d.]+)/i);
    if (w && h && parseFloat(h[1]) > 0) ratio = parseFloat(w[1]) / parseFloat(h[1]);
  }

  const hasCircle = /<clippath[^>]*>[\s\S]*?<circle/i.test(svg) || /<circle[^>]*\br\s*=/i.test(svg);

  // Square-ish → circular. Clearly wider → rectangular. A circle clip nudges
  // borderline cases toward circular.
  if (ratio >= 0.85 && ratio <= 1.18) return "circular";
  if (hasCircle && ratio <= 1.3) return "circular";
  return "rectangle";
}
