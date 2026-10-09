"use server";

import { and, count, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { notifyNewMessage } from "@/lib/email";
import {
  contactFieldSchema,
  fieldErrorsFrom,
  type ActionState,
} from "@/lib/validations/schemas";
import { site } from "@/lib/site";

/* -------------------------------------------------------------------------
   Public contact form.

   - Server-side Zod validation on the raw FormData.
   - Honeypot + time-trap before any write (both cheap, no DB cost).
   - Rate limits are enforced against the contact_messages table itself, so
     they hold across serverless instances (an in-process map would not).
   - Persist first, then attempt email. A provider failure never loses the
     message and never surfaces as a user-visible error: the row stays in
     Postgres with email_status='failed' and the admin inbox shows it.
   - Returns the same ActionState shape as the admin actions.
   -------------------------------------------------------------------------- */

/** Rejects submissions faster than a human can write. */
const FORM_MIN_AGE_MS = 2_500;
/** Upper bound generous enough to never punish a slow human. */
const FORM_MAX_AGE_MS = 24 * 3_600_000;
/** Tolerated clock skew between the client stamp and server time. */
const FORM_SKEW_MS = 60_000;

/** Burst window: one message per address per 30s. */
const BURST_WINDOW_MS = 30_000;
/** Sustained cap: five messages per address per hour. */
const HOURLY_WINDOW_MS = 3_600_000;
const HOURLY_MAX = 5;

const saveFailedMessage =
  "Your message could not be saved just now. Please email me directly instead.";

/** How many messages this address stored inside the trailing window. */
async function recentCount(email: string, windowMs: number): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(contactMessages)
    .where(
      and(
        eq(contactMessages.email, email),
        gt(contactMessages.createdAt, new Date(Date.now() - windowMs)),
      ),
    );
  return row?.n ?? 0;
}

export async function submitContactMessage(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = contactFieldSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject") ?? "",
    message: formData.get("message"),
    projectType: formData.get("projectType") ?? "",
    stage: formData.get("stage") ?? "",
    budget: formData.get("budget") ?? "",
    website: formData.get("website") ?? "",
    startedAt: formData.get("startedAt") ?? 0,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields and try again.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const { name, email, subject, message, projectType, stage, website, startedAt } =
    parsed.data;

  /* Honeypot: a real visitor never sees this field, so anything in it is a
     bot. Pretend it succeeded rather than telling the bot it was caught. */
  if (website) {
    return {
      status: "success",
      message: "Thanks — your message has been received.",
    };
  }

  /* Time-trap: submitted faster than a human can write. Skipped when the
     stamp is absent (e.g. no-JS) — the honeypot and rate limits still apply. */
  if (startedAt > 0) {
    const age = Date.now() - startedAt;
    if (
      startedAt > Date.now() + FORM_SKEW_MS ||
      age < FORM_MIN_AGE_MS ||
      age > FORM_MAX_AGE_MS
    ) {
      return {
        status: "error",
        message: "Please take a moment to write your message and try again.",
      };
    }
  }

  /* DB-backed rate limits: hold across serverless instances, unlike an
     in-process map. A failing check degrades to the same honest error the
     insert itself would produce, since the insert could not succeed either. */
  try {
    if ((await recentCount(email, BURST_WINDOW_MS)) > 0) {
      return {
        status: "error",
        message: "That was quick. Give it a few seconds before sending another message.",
      };
    }
    if ((await recentCount(email, HOURLY_WINDOW_MS)) >= HOURLY_MAX) {
      return {
        status: "error",
        message: `You've sent several messages recently. Please email me directly at ${site.email} instead.`,
      };
    }
  } catch {
    return { status: "error", message: saveFailedMessage };
  }

  /* The project-type/stage selects have no dedicated columns, so they are
     composed into the subject line — dropping them silently would lose the
     visitor's context. */
  const contextBits = [projectType, stage].filter(Boolean);
  const composedSubject =
    subject || (contextBits.length > 0 ? contextBits.join(" · ") : null);

  let inserted;
  try {
    [inserted] = await db
      .insert(contactMessages)
      .values({
        name,
        email,
        subject: composedSubject,
        message,
        emailStatus: "pending",
      })
      .returning();
  } catch {
    return {
      status: "error",
      message: saveFailedMessage,
    };
  }

  /* The message is safe in Postgres from here on. Email is best-effort: a
     provider failure is recorded on the row (email_status='failed', shown in
     the admin inbox) and the visitor still gets the honest confirmation. */
  const result = await notifyNewMessage(inserted);

  try {
    await db
      .update(contactMessages)
      .set({ emailStatus: result.sent ? "sent" : "failed" })
      .where(eq(contactMessages.id, inserted.id));
  } catch {
    /* The status flag is cosmetic — the message itself is already stored. */
  }

  return {
    status: "success",
    message: `Thanks ${name.split(" ")[0]} — your message is in. I reply to everything, usually within a couple of days. You can also reach me directly at ${site.email}.`,
  };
}
