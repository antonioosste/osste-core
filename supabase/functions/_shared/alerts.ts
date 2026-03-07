// Shared alert delivery helper for print order health checks
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const log = (step: string, details?: unknown) =>
  console.log(`[ALERTS] ${step}${details ? ` – ${JSON.stringify(details)}` : ""}`);

export interface AlertPayload {
  print_order_id: string;
  user_id: string;
  status: string;
  lulu_status: string | null;
  error_message: string | null;
  minutes_stuck: number;
  alert_type: string;
  alert_state: string;
  admin_url: string;
}

export type AlertResult = "sent" | "skipped" | "failed";

export interface AlertSendResult {
  print_order_id: string;
  alert_type: string;
  alert_state: string;
  result: AlertResult;
  error?: string;
}

/**
 * Check if an alert was already sent within the min interval.
 * If not, upsert the row and return true (should send).
 * Uses unique constraint for concurrency safety.
 */
async function shouldSendAlert(
  supabaseAdmin: ReturnType<typeof createClient>,
  printOrderId: string,
  alertType: string,
  alertState: string,
  minIntervalMinutes: number,
): Promise<boolean> {
  const { data: existing } = await supabaseAdmin
    .from("print_order_alerts")
    .select("id, last_sent_at, send_count")
    .eq("print_order_id", printOrderId)
    .eq("alert_type", alertType)
    .eq("alert_state", alertState)
    .maybeSingle();

  const now = new Date();

  if (existing) {
    const lastSent = new Date(existing.last_sent_at);
    const minutesSinceLast = (now.getTime() - lastSent.getTime()) / 60_000;
    if (minutesSinceLast < minIntervalMinutes) {
      return false; // too soon
    }
    // Update timestamp + increment count
    await supabaseAdmin
      .from("print_order_alerts")
      .update({ last_sent_at: now.toISOString(), send_count: existing.send_count + 1 })
      .eq("id", existing.id);
    return true;
  }

  // Insert new — use upsert to handle concurrent inserts gracefully
  const { error } = await supabaseAdmin
    .from("print_order_alerts")
    .upsert(
      {
        print_order_id: printOrderId,
        alert_type: alertType,
        alert_state: alertState,
        last_sent_at: now.toISOString(),
        send_count: 1,
      },
      { onConflict: "print_order_id,alert_type,alert_state" },
    );

  if (error) {
    // Conflict = another process already inserted, treat as "already sent"
    log("Upsert conflict (deduped)", { printOrderId, alertType, alertState });
    return false;
  }

  return true;
}

async function sendWebhook(url: string, payload: AlertPayload): Promise<void> {
  const emoji = payload.alert_state === "escalated" ? "🚨" : "⚠️";
  const body = {
    text: `${emoji} Print Order Alert [${payload.alert_state.toUpperCase()}]`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: [
            `${emoji} *Print Order Alert — ${payload.alert_state.toUpperCase()}*`,
            `*Type:* ${payload.alert_type}`,
            `*Order:* \`${payload.print_order_id}\``,
            `*Status:* ${payload.status} | Lulu: ${payload.lulu_status || "N/A"}`,
            `*Stuck:* ${payload.minutes_stuck} min`,
            payload.error_message ? `*Error:* ${payload.error_message}` : "",
            `<${payload.admin_url}|View Order>`,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      },
    ],
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Webhook ${resp.status}: ${text}`);
  }
}

async function sendEmail(
  resendApiKey: string,
  to: string[],
  payload: AlertPayload,
): Promise<void> {
  const emoji = payload.alert_state === "escalated" ? "🚨" : "⚠️";
  const subject = `${emoji} Print Order ${payload.alert_state}: ${payload.alert_type} — ${payload.print_order_id.slice(0, 8)}`;

  const html = `
    <h2>${emoji} Print Order Alert — ${payload.alert_state.toUpperCase()}</h2>
    <table style="border-collapse:collapse;font-family:sans-serif;">
      <tr><td style="padding:4px 12px;font-weight:bold;">Order ID</td><td style="padding:4px 12px;"><code>${payload.print_order_id}</code></td></tr>
      <tr><td style="padding:4px 12px;font-weight:bold;">User ID</td><td style="padding:4px 12px;"><code>${payload.user_id}</code></td></tr>
      <tr><td style="padding:4px 12px;font-weight:bold;">Alert Type</td><td style="padding:4px 12px;">${payload.alert_type}</td></tr>
      <tr><td style="padding:4px 12px;font-weight:bold;">Status</td><td style="padding:4px 12px;">${payload.status}</td></tr>
      <tr><td style="padding:4px 12px;font-weight:bold;">Lulu Status</td><td style="padding:4px 12px;">${payload.lulu_status || "N/A"}</td></tr>
      <tr><td style="padding:4px 12px;font-weight:bold;">Minutes Stuck</td><td style="padding:4px 12px;">${payload.minutes_stuck}</td></tr>
      ${payload.error_message ? `<tr><td style="padding:4px 12px;font-weight:bold;">Error</td><td style="padding:4px 12px;">${payload.error_message}</td></tr>` : ""}
    </table>
    <p><a href="${payload.admin_url}">View Order in Admin</a></p>
  `;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: "OSSTE Alerts <alerts@osste.com>",
      to,
      subject,
      html,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Resend ${resp.status}: ${text}`);
  }
}

/**
 * Send alert for a flagged print order, respecting dedupe/rate-limit.
 */
export async function sendOrderAlert(
  supabaseAdmin: ReturnType<typeof createClient>,
  payload: AlertPayload,
): Promise<AlertSendResult> {
  const minInterval = parseInt(Deno.env.get("ALERT_MIN_INTERVAL_MINUTES") || "60", 10);
  const webhookUrl = Deno.env.get("ALERT_WEBHOOK_URL");
  const alertEmailTo = Deno.env.get("ALERT_EMAIL_TO");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  const result: AlertSendResult = {
    print_order_id: payload.print_order_id,
    alert_type: payload.alert_type,
    alert_state: payload.alert_state,
    result: "skipped",
  };

  // No channels configured
  if (!webhookUrl && !(alertEmailTo && resendApiKey)) {
    log("No alert channels configured, skipping");
    return result;
  }

  // Dedupe check
  const shouldSend = await shouldSendAlert(
    supabaseAdmin,
    payload.print_order_id,
    payload.alert_type,
    payload.alert_state,
    minInterval,
  );

  if (!shouldSend) {
    log("Alert skipped (within min interval)", {
      orderId: payload.print_order_id,
      type: payload.alert_type,
      state: payload.alert_state,
    });
    return result;
  }

  // Send via configured channels
  let sent = false;

  if (webhookUrl) {
    try {
      await sendWebhook(webhookUrl, payload);
      sent = true;
      log("Webhook alert sent", { orderId: payload.print_order_id });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log("Webhook alert failed", { orderId: payload.print_order_id, error: msg });
      result.error = msg;
    }
  }

  if (alertEmailTo && resendApiKey) {
    const recipients = alertEmailTo.split(",").map((e) => e.trim()).filter(Boolean);
    if (recipients.length > 0) {
      try {
        await sendEmail(resendApiKey, recipients, payload);
        sent = true;
        log("Email alert sent", { orderId: payload.print_order_id, to: recipients });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log("Email alert failed", { orderId: payload.print_order_id, error: msg });
        if (!result.error) result.error = msg;
      }
    }
  }

  result.result = sent ? "sent" : "failed";
  return result;
}
