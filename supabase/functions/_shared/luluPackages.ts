// Single source of truth for Lulu pod_package_id mapping
// Each combo of format + trim_size maps to a specific env var holding the Lulu package ID.

export type PrintFormat = "paperback" | "hardcover";
export type TrimSize = "5.5x8.5" | "6x9" | "8.5x11";

const VALID_FORMATS: PrintFormat[] = ["paperback", "hardcover"];
const VALID_TRIM_SIZES: TrimSize[] = ["5.5x8.5", "6x9", "8.5x11"];

/** Env var key for each format+trim combo */
const ENV_MAP: Record<string, string> = {
  "paperback:5.5x8.5":  "LULU_POD_PAPERBACK_55X85",
  "paperback:6x9":      "LULU_POD_PAPERBACK_6X9",
  "paperback:8.5x11":   "LULU_POD_PAPERBACK_85X11",
  "hardcover:5.5x8.5":  "LULU_POD_HARDCOVER_55X85",
  "hardcover:6x9":      "LULU_POD_HARDCOVER_6X9",
  "hardcover:8.5x11":   "LULU_POD_HARDCOVER_85X11",
};

export function isValidFormat(v: unknown): v is PrintFormat {
  return typeof v === "string" && VALID_FORMATS.includes(v as PrintFormat);
}

export function isValidTrimSize(v: unknown): v is TrimSize {
  return typeof v === "string" && VALID_TRIM_SIZES.includes(v as TrimSize);
}

/**
 * Resolve the Lulu pod_package_id for a given format + trim_size.
 * Falls back to the global LULU_POD_PACKAGE_ID if a specific env var is not set.
 */
export function getPodPackageId(format: string, trimSize: string): string {
  if (!isValidFormat(format)) {
    throw new Error(`Invalid print format: '${format}'. Must be one of: ${VALID_FORMATS.join(", ")}`);
  }
  if (!isValidTrimSize(trimSize)) {
    throw new Error(`Invalid trim_size: '${trimSize}'. Must be one of: ${VALID_TRIM_SIZES.join(", ")}`);
  }

  const key = `${format}:${trimSize}`;
  const envVar = ENV_MAP[key];
  const value = Deno.env.get(envVar);

  if (value) return value;

  // Fallback to global (for backwards compat during rollout)
  const fallback = Deno.env.get("LULU_POD_PACKAGE_ID");
  if (fallback) {
    console.warn(`[luluPackages] No env var '${envVar}' set for ${key}, falling back to LULU_POD_PACKAGE_ID`);
    return fallback;
  }

  throw new Error(`No pod_package_id mapping for format='${format}', trim_size='${trimSize}'. Set env var '${envVar}' or 'LULU_POD_PACKAGE_ID'.`);
}
