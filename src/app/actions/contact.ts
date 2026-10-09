"use server";

import { eq } from "drizzle-orm";
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
   - Honeypot check before any write.
   - Persist first, then attempt email. A provider failure never loses the
     message and never surfaces as a user-visible error.
   - Returns the same ActionState shape as the admin actions.
   -------------------------------------------------------------------------- */

/** Cheap in-process throttle. Survives a single instance; documented limit. */
const recentSubmissions = new Map<string, number>();
const RATE_LIMIT_MS = 30_000;

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
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields and try again.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const { name, email, subject, message, projectType, stage, website } =
    parsed.data;

  /* Honeypot: a real visitor never sees this field, so anything in it is a
     bot. Pretend it succeeded rather than telling the bot it was caught. */
  if (website) {
    return {
      status: "success",
      message: "Thanks — your message has been received.",
    };
  }

  const last = recentSubmissions.get(email);
  const now = Date.now();
  if (last && now - last < RATE_LIMIT_MS) {
    return {
      status: "error",
      message: "That was quick. Give it a few seconds before sending another message.",
    };
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
      message:
        "Your message could not be saved just now. Please email me directly instead.",
    };
  }

  recentSubmissions.set(email, now);

  const result = await notifyNewMessage(inserted);

  await db
    .update(contactMessages)
    .set({ emailStatus: result.sent ? "sent" : "false" })
    .where(eq(contactMessages.id, inserted.id));

  return {
    status: "success",
    message: `Thanks ${name.split(" ")[0]} — your message is in. I reply to everything, usually within a couple of days. You can also reach me directly at ${site.email}.`,
  };
}
