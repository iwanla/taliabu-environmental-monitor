// Maps worker API error codes to user-facing copy. Thrown as RenderError so
// callers can distinguish intentional friendly messages from unexpected bugs.
export class RenderError extends Error {
  readonly code: string | null;
  readonly status: number;

  constructor(message: string, code: string | null, status: number) {
    super(message);
    this.name = "RenderError";
    this.code = code;
    this.status = status;
  }
}

export function friendlyRenderError(code: string | null, status: number): string {
  switch (code) {
    case "RENDER_COOLDOWN":
      return "Render service is cooling down after a repeated failure — wait a few seconds and retry.";
    case "RENDER_ERROR":
    case "STAC_PROVIDER_ERROR":
      return "Satellite provider failed for this request — retry, or try another date.";
    case "NO_USABLE_ACQUISITION":
      return "No usable scene found for this period — try a wider date range.";
    case "BBOX_OUT_OF_BOUNDS":
    case "TILE_OUT_OF_BOUNDS":
      return "Area is outside the supported Taliabu window.";
    case "INVALID_TIMERANGE":
    case "INVALID_TYPE":
    case "INVALID_TILE":
    case "INVALID_BODY":
    case "MISSING_TIMERANGE":
      return "Invalid request for this scene — try another date.";
    case "COPERNICUS_NOT_CONFIGURED":
      return "Satellite service is not configured.";
    default:
      return `Request failed (HTTP ${status}) — retry shortly.`;
  }
}

export async function throwFriendlyRenderError(res: Response, fallbackCode: string | null = null): Promise<never> {
  let code: string | null = fallbackCode;
  try {
    const data = (await res.json()) as { error?: string };
    if (typeof data.error === "string") code = data.error;
  } catch {
    // non-JSON body — fall through to status-based copy
  }
  throw new RenderError(friendlyRenderError(code, res.status), code, res.status);
}
