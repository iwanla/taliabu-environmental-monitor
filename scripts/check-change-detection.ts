import { diffPixels } from "../src/features/environmental-map/composables/changeDetectionCore.ts";

const px = (v: number | null) =>
  v == null ? [0, 0, 0, 0] : [Math.round(((v + 1) / 2) * 255), 0, 0, 255];

const buf = (vals: (number | null)[]) => new Uint8ClampedArray(vals.flatMap(px));

// vegetation-loss: 0.5 -> 0.3 (delta -0.2) fires; 0.5 -> 0.45 does not; no-data excluded
const a = buf([0.5, 0.5, null, 0.6]);
const b = buf([0.3, 0.45, 0.1, 0.6]);
const r = diffPixels(a, b, "vegetation-loss");
console.assert(r.changed === 1, `vegetation-loss changed: expected 1, got ${r.changed}`);
console.assert(r.valid === 3, `vegetation-loss valid: expected 3, got ${r.valid}`);
console.assert(r.out[3] === 255 && r.out[7] === 0, "only pixel 0 painted");

// new-bare-land: 0.3 -> 0.15 fires; 0.1 -> 0.05 does not (was already bare)
const c = buf([0.3, 0.1]);
const d = buf([0.15, 0.05]);
const r2 = diffPixels(c, d, "new-bare-land");
console.assert(r2.changed === 1, `new-bare-land changed: expected 1, got ${r2.changed}`);

// water-change both directions: -0.2 -> 0.3 gain, 0.3 -> -0.2 loss
const e = buf([-0.2, 0.3]);
const f = buf([0.3, -0.2]);
const r3 = diffPixels(e, f, "water-change");
console.assert(r3.changed === 2, `water-change changed: expected 2, got ${r3.changed}`);
console.assert(r3.out[3] === 255 && r3.out[7] === 255, "both water pixels painted");

// mask: exclude pixel 0 (the only vegetation-loss pixel) -> 0 changed, 2 valid
const r4 = diffPixels(a, b, "vegetation-loss", new Uint8Array([0, 1, 1, 1]));
console.assert(r4.changed === 0 && r4.valid === 2, `mask: expected 0 changed/2 valid, got ${r4.changed}/${r4.valid}`);

console.log("change-detection checks OK");
