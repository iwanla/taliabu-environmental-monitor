import assert from "node:assert";
import { friendlyRenderError, RenderError } from "../src/shared/render-errors.ts";

assert.equal(
  friendlyRenderError("RENDER_COOLDOWN", 503),
  "Render service is cooling down after a repeated failure — wait a few seconds and retry.",
);
assert.equal(
  friendlyRenderError("RENDER_ERROR", 502),
  "Satellite provider failed for this request — retry, or try another date.",
);
assert.equal(
  friendlyRenderError("STAC_PROVIDER_ERROR", 502),
  "Satellite provider failed for this request — retry, or try another date.",
);
assert.equal(friendlyRenderError("BBOX_OUT_OF_BOUNDS", 400), "Area is outside the supported Taliabu window.");
assert.equal(friendlyRenderError("TILE_OUT_OF_BOUNDS", 400), "Area is outside the supported Taliabu window.");
assert.equal(
  friendlyRenderError("INVALID_TIMERANGE", 400),
  "Invalid request for this scene — try another date.",
);
assert.equal(friendlyRenderError("COPERNICUS_NOT_CONFIGURED", 500), "Satellite service is not configured.");
assert.equal(friendlyRenderError(null, 500), "Request failed (HTTP 500) — retry shortly.");
assert.equal(friendlyRenderError("SOMETHING_NEW", 502), "Request failed (HTTP 502) — retry shortly.");

const err = new RenderError("msg", "RENDER_ERROR", 502);
assert.ok(err instanceof Error);
assert.equal(err.code, "RENDER_ERROR");
assert.equal(err.status, 502);

console.log("render-errors checks OK");
