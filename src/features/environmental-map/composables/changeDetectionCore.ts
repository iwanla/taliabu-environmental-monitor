export type ChangeType = "vegetation-loss" | "new-bare-land" | "water-change";

interface Rule {
  metric: "ndvi-raw" | "mndwi-raw";
  label: string;
  test: (a: number, b: number) => number;
  colors: [number, number, number][];
}

const WATER = 0.1;

export const CHANGE_RULES: Record<ChangeType, Rule> = {
  "vegetation-loss": {
    metric: "ndvi-raw",
    label: "NDVI drop >= 0.15",
    test: (a, b) => (b - a <= -0.15 ? 1 : 0),
    colors: [[192, 57, 43]],
  },
  "new-bare-land": {
    metric: "ndvi-raw",
    label: "NDVI >= 0.2 dropped below 0.2",
    test: (a, b) => (a >= 0.2 && b < 0.2 ? 1 : 0),
    colors: [[214, 137, 16]],
  },
  "water-change": {
    metric: "mndwi-raw",
    label: "MNDWI crossed 0.1 (gain or loss)",
    test: (a, b) => (a < WATER && b >= WATER ? 1 : a >= WATER && b < WATER ? 2 : 0),
    colors: [[31, 93, 154], [230, 126, 34]],
  },
};

const decode = (v: number) => (v / 255) * 2 - 1;

export function diffPixels(
  a: Uint8ClampedArray,
  b: Uint8ClampedArray,
  type: ChangeType,
  mask?: Uint8Array,
) {
  const rule = CHANGE_RULES[type];
  const out = new Uint8ClampedArray(a.length);
  let changed = 0;
  let valid = 0;
  let px = -1;
  for (let i = 0; i < a.length; i += 4) {
    px++;
    if (mask && !mask[px]) continue;
    if (a[i + 3] === 0 || b[i + 3] === 0) continue;
    valid++;
    const cls = rule.test(decode(a[i]), decode(b[i]));
    if (!cls) continue;
    const color = rule.colors[cls - 1];
    changed++;
    out[i] = color[0];
    out[i + 1] = color[1];
    out[i + 2] = color[2];
    out[i + 3] = 255;
  }
  return { out, changed, valid };
}
