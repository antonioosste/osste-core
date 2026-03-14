// Shared Lulu API helper — used by stripe-webhook, submit-print-order-to-lulu, lulu-sync-order-status

export interface LuluResult {
  print_job_id: string;
  order_id: string;
  status_name: string;
  total_cost_incl_tax: number | null;
  currency: string | null;
}

/** Error subclass for classifiable Lulu API errors */
export class LuluApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = "LuluApiError";
  }
}

// ── Retry utility ──────────────────────────────────────────────────────

const RETRY_DELAYS = [1000, 2000, 4000, 8000]; // 4 retries

function isRetryable(err: unknown): boolean {
  if (err instanceof LuluApiError) return err.retryable;
  // Network / TypeError (fetch failures) are retryable
  if (err instanceof TypeError) return true;
  return false;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch with exponential-backoff retry.
 * Retries on network errors, 429, and 5xx.
 * Does NOT retry 4xx validation errors.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  log: (step: string, details?: unknown) => void = console.log,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const resp = await fetch(url, init);

      if (resp.ok) return resp;

      const text = await resp.text();

      // Classify
      const retryable = resp.status === 429 || resp.status >= 500;
      const err = new LuluApiError(
        `Lulu API ${resp.status}: ${text}`,
        resp.status,
        retryable,
      );

      if (!retryable) throw err; // non-retryable 4xx → fail immediately

      lastError = err;
    } catch (e) {
      if (!isRetryable(e)) throw e;
      lastError = e;
    }

    // If we have retries left, wait
    if (attempt < RETRY_DELAYS.length) {
      const delay = RETRY_DELAYS[attempt];
      log("Retry", { attempt: attempt + 1, delay });
      await sleep(delay);
    }
  }

  // Exhausted retries
  throw lastError;
}

// ── Auth ───────────────────────────────────────────────────────────────

export async function getLuluAccessToken(): Promise<string> {
  const clientKey = Deno.env.get("LULU_CLIENT_KEY")!;
  const clientSecret = Deno.env.get("LULU_CLIENT_SECRET")!;
  const useSandbox = Deno.env.get("LULU_USE_SANDBOX") === "true";
  const tokenUrl = useSandbox
    ? "https://api.sandbox.lulu.com/auth/realms/glasstree/protocol/openid-connect/token"
    : "https://api.lulu.com/auth/realms/glasstree/protocol/openid-connect/token";

  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientKey,
      client_secret: clientSecret,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Lulu auth failed (${resp.status}): ${text}`);
  }

  const data = await resp.json();
  return data.access_token;
}

// ── Create print job (with retry) ──────────────────────────────────────

export async function createLuluPrintJob(
  order: Record<string, unknown>,
  log: (step: string, details?: unknown) => void = console.log,
): Promise<LuluResult> {
  const { getPodPackageId, isValidFormat, isValidTrimSize } = await import("./luluPackages.ts");

  const useSandbox = Deno.env.get("LULU_USE_SANDBOX") === "true";
  const apiBase = useSandbox ? "https://api.sandbox.lulu.com" : "https://api.lulu.com";

  const format = (order.format as string) || "paperback";
  const trimSize = (order.trim_size as string) || "6x9";

  if (!isValidFormat(format)) {
    throw new LuluApiError(`Invalid format: '${format}'`, 400, false);
  }
  if (!isValidTrimSize(trimSize)) {
    throw new LuluApiError(`Invalid trim_size: '${trimSize}'`, 400, false);
  }

  const podPackageId = getPodPackageId(format, trimSize);
  log("Resolved pod_package_id", { format, trimSize, podPackageId });

  const accessToken = await getLuluAccessToken();

  const interiorUrl = order.interior_pdf_url as string;
  const coverUrl = order.cover_pdf_url as string;

  if (!interiorUrl || !coverUrl) {
    throw new LuluApiError("Missing interior_pdf_url or cover_pdf_url on print_orders row", 400, false);
  }

  // Normalize and validate shipping codes
  const countryCode = ((order.shipping_country as string) || "US").trim().toUpperCase();
  let stateCode = ((order.shipping_state as string) || "").trim().toUpperCase();

  if (countryCode === "US" && stateCode.length > 2) {
    const US_STATES: Record<string, string> = {
      ALABAMA:"AL",ALASKA:"AK",ARIZONA:"AZ",ARKANSAS:"AR",CALIFORNIA:"CA",
      COLORADO:"CO",CONNECTICUT:"CT",DELAWARE:"DE",FLORIDA:"FL",GEORGIA:"GA",
      HAWAII:"HI",IDAHO:"ID",ILLINOIS:"IL",INDIANA:"IN",IOWA:"IA",KANSAS:"KS",
      KENTUCKY:"KY",LOUISIANA:"LA",MAINE:"ME",MARYLAND:"MD",MASSACHUSETTS:"MA",
      MICHIGAN:"MI",MINNESOTA:"MN",MISSISSIPPI:"MS",MISSOURI:"MO",MONTANA:"MT",
      NEBRASKA:"NE",NEVADA:"NV","NEW HAMPSHIRE":"NH","NEW JERSEY":"NJ",
      "NEW MEXICO":"NM","NEW YORK":"NY","NORTH CAROLINA":"NC","NORTH DAKOTA":"ND",
      OHIO:"OH",OKLAHOMA:"OK",OREGON:"OR",PENNSYLVANIA:"PA","RHODE ISLAND":"RI",
      "SOUTH CAROLINA":"SC","SOUTH DAKOTA":"SD",TENNESSEE:"TN",TEXAS:"TX",
      UTAH:"UT",VERMONT:"VT",VIRGINIA:"VA",WASHINGTON:"WA","WEST VIRGINIA":"WV",
      WISCONSIN:"WI",WYOMING:"WY","DISTRICT OF COLUMBIA":"DC",
      "PUERTO RICO":"PR","GUAM":"GU","AMERICAN SAMOA":"AS",
      "U.S. VIRGIN ISLANDS":"VI","NORTHERN MARIANA ISLANDS":"MP",
    };
    const mapped = US_STATES[stateCode];
    if (mapped) stateCode = mapped;
  }

  if (countryCode === "US" && !/^[A-Z]{2}$/.test(stateCode)) {
    throw new LuluApiError(`Invalid shipping_state: must be valid US state, got '${stateCode}'`, 400, false);
  }

  const contactEmail = (order.contact_email as string) || "stories@osste.com";
  const phoneNumber = (order.shipping_phone as string) || "+17135551234";

  const payload = {
    contact_email: contactEmail,
    external_id: order.id as string,
    line_items: [
      {
        external_id: order.id as string,
        quantity: order.quantity as number,
        title: order.book_title as string,
        printable_normalization: {
          pod_package_id: podPackageId,
          cover: { source_url: coverUrl },
          interior: { source_url: interiorUrl },
        },
      },
    ],
    production_delay: 120,
    shipping_address: {
      name: order.shipping_name as string,
      street1: order.shipping_address as string,
      city: order.shipping_city as string,
      state_code: stateCode,
      postcode: order.shipping_zip as string,
      country_code: countryCode,
      phone_number: phoneNumber,
      email: contactEmail,
    },
    shipping_level: "MAIL",
  };

  log("Lulu payload", payload);

  const resp = await fetchWithRetry(
    `${apiBase}/print-jobs/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    },
    log,
  );

  const text = await resp.text();
  const job = JSON.parse(text);
  log("Lulu print job created", { id: job.id, status: job.status?.name });

  return {
    print_job_id: String(job.id),
    order_id: job.order_id ? String(job.order_id) : "",
    status_name: job.status?.name || "CREATED",
    total_cost_incl_tax: job.costs?.total_cost_incl_tax ? Number(job.costs.total_cost_incl_tax) : null,
    currency: job.costs?.currency || null,
  };
}
