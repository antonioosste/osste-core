/** Shared print-order status display config */

export interface StatusDisplay {
  label: string;
  color: string;
  helperText: string;
  isFailure?: boolean;
}

export const STATUS_MAP: Record<string, StatusDisplay> = {
  checkout_created: {
    label: "Checkout started",
    color: "bg-yellow-100 text-yellow-800",
    helperText: "Your checkout session was created. Complete payment to proceed.",
  },
  paid: {
    label: "Payment received",
    color: "bg-green-100 text-green-800",
    helperText: "We've received your payment and are preparing your order.",
  },
  awaiting_pdfs: {
    label: "Preparing print files",
    color: "bg-blue-100 text-blue-800",
    helperText: "We're generating the print-ready files for your book.",
  },
  lulu_submitting: {
    label: "Sending to printer",
    color: "bg-blue-100 text-blue-800",
    helperText: "Your order is being submitted to our printing partner.",
  },
  lulu_created: {
    label: "Printer accepted your order",
    color: "bg-blue-100 text-blue-800",
    helperText: "The printer has received your book and will begin production soon.",
  },
  lulu_unpaid: {
    label: "Printer processing",
    color: "bg-yellow-100 text-yellow-800",
    helperText: "Your order is being processed by the printer.",
  },
  lulu_accepted: {
    label: "Printer accepted your order",
    color: "bg-blue-100 text-blue-800",
    helperText: "Your book has been accepted and is queued for printing.",
  },
  lulu_in_production: {
    label: "Printing in progress",
    color: "bg-purple-100 text-purple-800",
    helperText: "Your book is being printed and bound. This usually takes 3–5 business days.",
  },
  lulu_production_delayed: {
    label: "Printing delayed",
    color: "bg-yellow-100 text-yellow-800",
    helperText: "Production is taking longer than expected. We'll update you when it ships.",
  },
  lulu_shipped: {
    label: "Shipped",
    color: "bg-green-100 text-green-800",
    helperText: "Your book is on its way! Check your tracking link for delivery updates.",
  },
  lulu_rejected: {
    label: "Action needed",
    color: "bg-red-100 text-red-800",
    helperText: "The printer flagged an issue with your order. Please contact support.",
    isFailure: true,
  },
  lulu_error: {
    label: "Action needed",
    color: "bg-red-100 text-red-800",
    helperText: "Something went wrong during printing. Our team has been notified.",
    isFailure: true,
  },
  lulu_retry_exhausted: {
    label: "Action needed",
    color: "bg-red-100 text-red-800",
    helperText: "We were unable to submit your order after multiple attempts. Please contact support.",
    isFailure: true,
  },
  lulu_cancelled: {
    label: "Cancelled",
    color: "bg-muted text-muted-foreground",
    helperText: "This order has been cancelled.",
  },
  needs_manual_review: {
    label: "Under review",
    color: "bg-yellow-100 text-yellow-800",
    helperText: "Our team is reviewing your order. We'll reach out if we need anything.",
  },
};

export const TERMINAL_STATUSES = new Set([
  "lulu_shipped",
  "lulu_rejected",
  "lulu_error",
  "lulu_retry_exhausted",
  "lulu_cancelled",
]);

export const DEFAULT_STATUS: StatusDisplay = {
  label: "Processing",
  color: "bg-muted text-muted-foreground",
  helperText: "Your order is being processed.",
};

export function getStatusDisplay(status: string): StatusDisplay {
  return STATUS_MAP[status] || { ...DEFAULT_STATUS, label: status };
}

export function buildSupportMailto(orderId: string, errorMessage?: string | null): string {
  const subject = encodeURIComponent(`Print Order Help — ${orderId}`);
  const body = encodeURIComponent(
    `Hi,\n\nI need help with my print order.\n\nOrder ID: ${orderId}${errorMessage ? `\nError: ${errorMessage}` : ""}\n\nThanks!`
  );
  return `mailto:support@osste.com?subject=${subject}&body=${body}`;
}
