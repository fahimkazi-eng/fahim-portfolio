import "server-only";
import { Resend } from "resend";
import type { ContactMessage } from "@/lib/db/schema";

/**
 * Email notifications for contact messages.
 *
 * Deliberately optional: with no RESEND_API_KEY the message is still stored
 * in Postgres and visible in the dashboard. Email is a bonus channel, never
 * the system of record — a missing key degrades the feature instead of
 * losing the message.
 */
export type NotifyResult = { sent: boolean; reason: string };

export async function notifyNewMessage(
  message: ContactMessage,
): Promise<NotifyResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_NOTIFY_EMAIL;

  if (!apiKey || !to) {
    return {
      sent: false,
      reason: "Email notifications are not configured (RESEND_API_KEY / CONTACT_NOTIFY_EMAIL). Message stored in the database only.",
    };
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: "Portfolio <onboarding@resend.dev>",
      to,
      replyTo: message.email,
      subject: `New portfolio message: ${message.subject || "No subject"}`,
      text: [
        `From:    ${message.name} <${message.email}>`,
        `Subject: ${message.subject || "(none)"}`,
        `Received: ${message.createdAt.toISOString()}`,
        "",
        message.message,
      ].join("\n"),
    });

    return { sent: true, reason: "Notification email sent." };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unknown email provider error";
    return {
      sent: false,
      reason: `Message stored, but the notification email failed: ${detail}`,
    };
  }
}
