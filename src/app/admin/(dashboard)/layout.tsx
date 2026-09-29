import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getSession } from "@/lib/auth";
import { AdminNav } from "@/components/admin/auth-forms";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: "Admin", template: `%s · Admin · ${site.name}` },
  robots: { index: false, follow: false },
};

/* Force every admin route to be dynamic: nothing here may be cached. */
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* Second line of defence. proxy.ts already redirects, but a layout that
     trusts it alone would be one config change away from a data leak. */
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-svh bg-canvas text-fg">
      <header className="sticky top-0 z-30 border-b border-line glass">
        <div className="mx-auto flex max-w-[86rem] flex-wrap items-center justify-between gap-4 px-[clamp(1rem,0.5rem+2vw,3rem)] py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="font-display text-[1.05rem] font-semibold tracking-tight text-fg"
            >
              Dashboard
            </Link>
            <span
              aria-hidden="true"
              className="type-mono hidden text-fg-subtle sm:inline"
            >
              {site.name}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="type-mono inline-flex items-center gap-1.5 rounded-pill border border-line-strong px-3 py-1.5 text-fg-muted transition-colors duration-200 hover:border-accent hover:text-accent"
            >
              View site
              <ExternalLink className="size-3" strokeWidth={2} />
            </a>
            <AdminNav email={session.email} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[86rem] flex-col gap-8 px-[clamp(1rem,0.5rem+2vw,3rem)] py-8 lg:flex-row lg:gap-10">
        <aside className="lg:w-56 lg:shrink-0">
          <div className="lg:sticky lg:top-24">
            <AdminSidebar />
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

/* `as const` so typedRoutes can see the literal paths. */
const ADMIN_LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/experience", label: "Experience" },
  { href: "/admin/education", label: "Education" },
  { href: "/admin/skills", label: "Skills" },
  { href: "/admin/services", label: "Services" },
] as const;

function AdminSidebar() {
  return (
    <nav aria-label="Admin sections" className="lg:border-r lg:border-line lg:pr-6">
      <ul className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
        {ADMIN_LINKS.map((item) => (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              className="type-mono block whitespace-nowrap rounded-lg px-3 py-2 text-fg-muted transition-colors duration-200 hover:bg-fg/[0.05] hover:text-fg"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
