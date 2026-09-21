import assert from "node:assert";
import {
  cacheTtlSeconds,
  clampDimension,
  isBboxInBounds,
  RENDER_BBOX_LIMIT,
  renderCacheKey,
} from "../worker/services/render-guards.ts";

assert.equal(clampDimension(512), 512);
assert.equal(clampDimension(99999), 1600, "oversize clamps to max");
assert.equal(clampDimension(4), 16, "undersize clamps to min");
assert.equal(clampDimension("abc"), 1024, "non-numeric falls back to default");
assert.equal(clampDimension(undefined, 256), 256);

assert.equal(isBboxInBounds([123.8, -2.5, 125.8, -1.0]), true);
assert.equal(isBboxInBounds([124.2, -2.3, 125.4, -1.2]), true);
assert.equal(isBboxInBounds([0, 0, 1, 1]), false, "outside limit");
assert.equal(isBboxInBounds([124, -2.5, 125.9, -1.0]), false, "partially outside limit");
assert.equal(isBboxInBounds([125, -2, 124, -1.5]), false, "w >= e");
assert.equal(isBboxInBounds([124, -1.5, 125, -2] as [number, number, number, number]), false, "s >= n");

const a = renderCacheKey({ type: "ndvi", bbox: "1,2,3,4", from: "2026-01-01", to: "2026-01-02", width: 512 });
const b = renderCacheKey({ from: "2026-01-01", to: "2026-01-02", width: 512, type: "ndvi", bbox: "1,2,3,4" });
assert.equal(a.url, b.url, "key is order-independent");
assert.ok(a.url.includes("type=ndvi"));

assert.equal(cacheTtlSeconds(new Date(Date.now() - 86400000).toISOString().slice(0, 10)), 3600, "recent window short TTL");
assert.equal(cacheTtlSeconds("2020-01-01"), 604800, "historical window long TTL");
assert.deepEqual(RENDER_BBOX_LIMIT, [123.8, -2.5, 125.8, -1.0]);

console.log("render-guards checks OK");