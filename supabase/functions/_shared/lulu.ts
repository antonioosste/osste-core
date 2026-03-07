// Shared Lulu API helper — used by stripe-webhook and submit-print-order-to-lulu

export interface LuluResult {
  print_job_id: string;
  order_id: string;
  status_name: string;
  total_cost_incl_tax: number | null;
  currency: string | null;
}

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

export async function createLuluPrintJob(
  order: Record<string, unknown>,
  log: (step: string, details?: unknown) => void = console.log,
): Promise<LuluResult> {
  const useSandbox = Deno.env.get("LULU_USE_SANDBOX") === "true";
  const apiBase = useSandbox ? "https://api.sandbox.lulu.com" : "https://api.lulu.com";
  const podPackageId = Deno.env.get("LULU_POD_PACKAGE_ID");

  if (!podPackageId) {
    throw new Error("Missing LULU_POD_PACKAGE_ID secret");
  }

  const accessToken = await getLuluAccessToken();

  const interiorUrl = order.interior_pdf_url as string;
  const coverUrl = order.cover_pdf_url as string;

  if (!interiorUrl || !coverUrl) {
    throw new Error("Missing interior_pdf_url or cover_pdf_url on print_orders row");
  }

  // Normalize and validate shipping codes
  const countryCode = ((order.shipping_country as string) || "US").trim().toUpperCase();
  let stateCode = ((order.shipping_state as string) || "").trim().toUpperCase();

  // If US and state is a full name, convert to 2-letter code
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
    if (mapped) {
      stateCode = mapped;
    }
  }

  if (countryCode === "US" && (!/^[A-Z]{2}$/.test(stateCode))) {
    throw new Error(`Invalid shipping_state: must be valid US state, got '${stateCode}'`);
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

  const resp = await fetch(`${apiBase}/print-jobs/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`Lulu API error (${resp.status}): ${text}`);
  }

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
