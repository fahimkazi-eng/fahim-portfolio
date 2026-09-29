import { getMessages, getUnreadMessageCount } from "@/lib/db/queries";
import { MessageCard } from "@/components/admin/message-card";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const [messages, unread] = await Promise.all([
    getMessages(),
    getUnreadMessageCount(),
  ]);

  return (
    <div className="space-y-7">
      <header>
        <p className="type-mono text-accent">Messages</p>
        <h1 className="type-display mt-2 text-h2 text-fg">Inbox</h1>
        <p className="mt-2 max-w-[56ch] text-body text-fg-muted">
          Submissions from the contact form. Stored in Postgres; an email
          notification is sent when Resend is configured.
        </p>
      </header>

      {messages.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-body text-fg-muted">
            No messages yet. Send one from the contact form to see it appear
            here.
          </p>
        </Card>
      ) : (
        <>
          {unread > 0 ? (
            <p className="type-mono text-fg-subtle">
              {unread} unread
            </p>
          ) : null}
          <ul className="space-y-3">
            {messages.map((message) => (
              <li key={message.id}>
                <MessageCard message={message} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
