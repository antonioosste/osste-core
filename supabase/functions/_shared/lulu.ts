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
  const podPackageId = Deno.env.get("LULU_POD_PACKAGE_ID") || "0600X0900BWSTDPB060UW444MXX";

  const accessToken = await getLuluAccessToken();

  const interiorUrl = order.interior_pdf_url as string;
  const coverUrl = order.cover_pdf_url as string;

  if (!interiorUrl || !coverUrl) {
    throw new Error("Missing interior_pdf_url or cover_pdf_url on print_orders row");
  }

  const payload = {
    contact_email: "stories@osste.com",
    external_id: order.id as string,
    line_items: [
      {
        external_id: order.id as string,
        printable_normalization: {
          cover: { source_url: coverUrl },
          interior: { source_url: interiorUrl },
        },
        pod_package_id: podPackageId,
        quantity: order.quantity as number,
        title: order.book_title as string,
      },
    ],
    production_delay: 120,
    shipping_address: {
      city: order.shipping_city as string,
      country_code: (order.shipping_country as string) || "US",
      name: order.shipping_name as string,
      phone_number: "",
      postcode: order.shipping_zip as string,
      state_code: order.shipping_state as string,
      street1: order.shipping_address as string,
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
