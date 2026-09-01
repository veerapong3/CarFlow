import type { Booking } from "@/types";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function destinationLine(booking: Booking): string {
  return [booking.destination, booking.province].filter(Boolean).join(", ");
}
