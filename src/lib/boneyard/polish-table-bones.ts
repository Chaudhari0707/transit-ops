/**
 * Post-process captured table cell bones toward Sardhar-style polished pills:
 * - Sardhar: `<Skeleton className="h-6 w-full rounded-2xl" />` inside each cell
 * - Boneyard default: full `td`/`th` bounding rects (solid column slabs)
 *
 * Inset each non-container bone and force a pill radius so the overlay looks
 * like cell content bars, not filled columns.
 */

/** Target bar height in px (Tailwind h-6). */
const PILL_HEIGHT = 24;
/** Horizontal inset as % of container (≈ cell padding). */
const INSET_X_PCT = 1.2;
/** Corner radius for rounded-2xl-ish pills. */
const PILL_RADIUS = 16;

function polishBone(raw: unknown): unknown {
  if (!Array.isArray(raw) || raw.length < 5) {
    return raw;
  }

  const x = Number(raw[0]);
  const y = Number(raw[1]);
  const w = Number(raw[2]);
  const h = Number(raw[3]);
  const isContainer = Boolean(raw[5]);

  if (isContainer || !Number.isFinite(x + y + w + h)) {
    return raw;
  }

  const nextH = Math.min(PILL_HEIGHT, Math.max(12, h - 8));
  const nextY = y + Math.max(0, (h - nextH) / 2);
  const nextX = x + INSET_X_PCT;
  const nextW = Math.max(2, w - INSET_X_PCT * 2);

  return [nextX, Math.round(nextY), nextW, Math.round(nextH), PILL_RADIUS];
}

/** Accepts generated ResponsiveBones JSON (loose) and returns the same shape. */
export function polishTableBones<T>(data: T): T {
  const record = data as {
    breakpoints?: Record<string, { bones?: unknown[] }>;
  };

  if (!record?.breakpoints || typeof record.breakpoints !== "object") {
    return data;
  }

  const breakpoints: Record<string, { bones?: unknown[] }> = {};

  for (const [bp, result] of Object.entries(record.breakpoints)) {
    breakpoints[bp] = {
      ...result,
      bones: (result.bones ?? []).map(polishBone),
    };
  }

  return {
    ...record,
    breakpoints,
  } as T;
}
