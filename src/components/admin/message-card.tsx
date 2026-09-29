"use client";

import { useState } from "react";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import type { ContactMessage } from "@/lib/db/schema";
import { deleteMessageAction, markMessageReadAction } from "@/app/actions/admin";
import { Card } from "@/components/ui/card";
import { InlineAction } from "@/components/admin/form-primitives";

const STATUS_LABEL: Record<string, string> = {
  false: "Email not configured",
  pending: "Email pending",
  sent: "Email sent",
  failed: "Email failed",
};

export function MessageCard({ message }: { message: ContactMessage }) {
  const [expanded, setExpanded] = useState(!message.read);

  return (
    <Card className={`p-5 ${message.read ? "" : "border-accent/40"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            {!message.read ? (
              <span className="type-mono rounded-pill bg-accent px-2 py-0.5 text-accent-fg">
                New
              </span>
            ) : null}
            <p className="font-display text-[1.05rem] font-semibold tracking-tight text-fg">
              {message.name}
            </p>
            <a
              href={`mailto:${message.email}?subject=${encodeURIComponent(
                `Re: ${message.subject || "Your message"}`,
              )}`}
              className="type-mono break-all text-fg-muted transition-colors duration-200 hover:text-accent"
            >
              {message.email}
            </a>
          </div>

          {message.subject ? (
            <p className="mt-1.5 text-[0.9rem] text-fg">{message.subject}</p>
          ) : null}

          <p
            className={`mt-2.5 whitespace-pre-wrap text-body leading-relaxed text-fg-muted ${
              expanded ? "" : "line-clamp-2"
            }`}
          >
            {message.message}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <time
            dateTime={message.createdAt.toISOString()}
            className="type-mono text-fg-subtle"
          >
            {message.createdAt.toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="type-mono text-fg-subtle transition-colors duration-200 hover:text-accent"
            >
              {expanded ? "Collapse" : "Expand"}
            </button>

            {!message.read ? (
              <InlineAction
                action={markMessageReadAction}
                hidden={{ id: message.id }}
                title="Mark as read"
              >
                <MailOpen className="size-3" strokeWidth={2} />
                Mark read
              </InlineAction>
            ) : (
              <span className="type-mono inline-flex items-center gap-1.5 text-fg-subtle">
                <Mail className="size-3" strokeWidth={2} />
                Read
              </span>
            )}

            <InlineAction
              action={deleteMessageAction}
              hidden={{ id: message.id }}
              confirm={`Delete the message from ${message.name}?`}
              title="Delete message"
            >
              <Trash2 className="size-3" strokeWidth={2} />
              Delete
            </InlineAction>
          </div>
        </div>
      </div>

      <p className="type-mono mt-4 border-t border-line pt-3 text-fg-subtle">
        {STATUS_LABEL[message.emailStatus] ?? message.emailStatus}
      </p>
    </Card>
  );
}
