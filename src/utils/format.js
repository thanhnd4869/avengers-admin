const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat("vi-VN");
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});
const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

export function formatMoney(value) {
  return currencyFormatter.format(value ?? 0);
}

export function formatNumber(value) {
  return numberFormatter.format(value ?? 0);
}

export function formatDateTime(value) {
  return value ? dateTimeFormatter.format(new Date(value)) : "—";
}

export function formatDate(value) {
  return value ? dateFormatter.format(new Date(value)) : "—";
}

export const ORDER_STATUS_LABELS = {
  pending: "Pending",
  paid: "Paid",
  expired: "Expired",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUS_LABELS = {
  pending: "Pending",
  succeeded: "Succeeded",
  failed: "Failed",
  refund_required: "Refund owed",
  refunded: "Refunded",
};

/** A refund paid back keeps its stored status; this is what to show. */
export function paymentDisplayStatus(payment) {
  return payment.status === "refund_required" && payment.refundedAt ? "refunded" : payment.status;
}

/** "Mario Kart 8" -> "mario-kart-8", matching the API's slug rule. */
export function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
