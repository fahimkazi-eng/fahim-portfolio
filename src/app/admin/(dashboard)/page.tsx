import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDashboardCounts, getMessages, getAllProjects } from "@/lib/db/queries";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [counts, messages, projects, session] = await Promise.all([
    getDashboardCounts(),
    getMessages(),
    getAllProjects(),
    getSession(),
  ]);

  const recent = messages.slice(0, 4);
  const drafts = projects.filter((p) => !p.published);

  return (
    <div className="space-y-8">
      <header>
        <p className="type-mono text-accent">Overview</p>
        <h1 className="type-display mt-2 text-h2 text-fg">
          Welcome back{session?.email ? "" : ""}.
        </h1>
        <p className="mt-2 max-w-[56ch] text-body text-fg-muted">
          Everything on the public site is driven by the database. Edit
          anything here and the public page updates without a redeploy.
        </p>
      </header>

      {/* Counters */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(
          [
            { label: "Projects", value: counts.projects, href: "/admin/projects" },
            { label: "Messages", value: counts.messages, href: "/admin/messages" },
            { label: "Unread", value: counts.unread, href: "/admin/messages" },
            { label: "Roles", value: counts.experience, href: "/admin/experience" },
          ] as const
        ).map((stat) => (
          <Link key={stat.label} href={stat.href} className="group">
            <Card sweep className="p-5">
              <p className="type-mono text-fg-subtle">{stat.label}</p>
              <p className="type-display mt-2 text-h1 leading-none text-fg transition-colors duration-300 group-hover:text-accent">
                {String(stat.value).padStart(2, "0")}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      {drafts.length > 0 ? (
        <Card className="border-accent/40 bg-accent/[0.05] p-5">
          <p className="type-mono text-accent">Needs attention</p>
          <p className="mt-2 text-body text-fg">
            {drafts.length} project{drafts.length === 1 ? " is" : "s are"}{" "}
            still a draft and will not appear on the public site:{" "}
            {drafts.map((d) => d.title).join(", ")}.
          </p>
        </Card>
      ) : null}

      {/* Recent messages */}
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-h4 tracking-tight text-fg">
            Recent messages
          </h2>
          <Link
            href="/admin/messages"
            className="type-mono inline-flex items-center gap-1.5 text-fg-muted transition-colors duration-200 hover:text-accent"
          >
            All messages
            <ArrowRight className="size-3" strokeWidth={2} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <Card className="p-6">
            <p className="text-body text-fg-muted">
              No messages yet. Submissions from the contact form land here.
            </p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {recent.map((message) => (
              <li key={message.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-body text-fg">
                      <span
                        aria-hidden="true"
                        className={`mr-2 inline-block size-1.5 rounded-full align-middle ${
                          message.read ? "bg-line-strong" : "bg-accent"
                        }`}
                      />
                      {message.name}
                      <span className="text-fg-subtle"> · {message.email}</span>
                    </p>
                    <p className="mt-1 line-clamp-1 text-[0.8125rem] text-fg-muted">
                      {message.message}
                    </p>
                  </div>
                  <time
                    dateTime={message.createdAt.toISOString()}
                    className="type-mono shrink-0 text-fg-subtle"
                  >
                    {message.createdAt.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Card className="p-5">
        <p className="type-mono text-fg-subtle">Environment</p>
        <dl className="mt-3 grid gap-2 text-[0.8125rem] sm:grid-cols-2">
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">Database</dt>
            <dd className="font-mono text-fg">Neon Postgres</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">Email notifications</dt>
            <dd className="font-mono text-fg">
              {process.env.RESEND_API_KEY ? "Configured" : "Not configured"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">Site</dt>
            <dd className="font-mono text-fg">{site.name}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
