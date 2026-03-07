// Shared audit event logger for print order system
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

export interface AuditEvent {
  print_order_id: string;
  actor_type: "user" | "admin" | "system" | "webhook";
  actor_id?: string | null;
  event_type: string;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
}

/**
 * Append an immutable audit event to print_order_events.
 * Uses service-role client (bypasses RLS).
 * Never throws — logs errors and continues.
 */
export async function logAuditEvent(
  supabaseAdmin: ReturnType<typeof createClient>,
  event: AuditEvent,
): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("print_order_events").insert({
      print_order_id: event.print_order_id,
      actor_type: event.actor_type,
      actor_id: event.actor_id || null,
      event_type: event.event_type,
      old_values: event.old_values || null,
      new_values: event.new_values || null,
      meta: event.meta || null,
    });
    if (error) {
      console.log(`[AUDIT] Failed to log event: ${error.message}`, event);
    }
  } catch (e) {
    console.log(`[AUDIT] Exception logging event: ${(e as Error).message}`, event);
  }
}
