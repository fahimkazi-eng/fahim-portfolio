import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/admin/auth-forms";
import { site } from "@/lib/site";
import { TypeCaret } from "@/components/sections/type-caret";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ from?: string | string[] }>;
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const session = await getSession();
  if (session) redirect("/admin");

  const params = await searchParams;
  const from = Array.isArray(params.from) ? params.from[0] : params.from;
  // Only same-origin relative paths are ever honoured.
  const redirectTo =
    from && from.startsWith("/") && !from.startsWith("//") ? from : "/admin";

  return (
    <main className="relative grid min-h-svh place-items-center px-5 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_45%_at_50%_35%,color-mix(in_oklab,var(--accent)_14%,transparent),transparent_70%)]"
      />

      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="type-mono text-accent">Restricted area</p>
          <h1 className="type-display mt-3 text-h2 text-fg">
            Admin
            <TypeCaret />
          </h1>
          <p className="mt-3 text-body text-fg-muted">
            Sign in to manage the content on {site.name}&apos;s portfolio.
          </p>
        </div>

        <div className="rounded-card border border-line bg-surface p-[clamp(1.5rem,3vw,2rem)]">
          <LoginForm redirectTo={redirectTo} />
        </div>

        <p className="mt-6 text-[0.8125rem] leading-relaxed text-fg-subtle">
          Sessions are stored in an HTTP-only, SameSite cookie signed with
          <code className="mx-1 font-mono text-fg-muted">AUTH_SECRET</code>
          and expire after eight hours. If you have not run
          <code className="mx-1 font-mono text-fg-muted">npm run db:seed</code>
          , no account exists yet — set{" "}
          <code className="font-mono text-fg-muted">ADMIN_EMAIL</code> and{" "}
          <code className="font-mono text-fg-muted">ADMIN_PASSWORD</code> in
          <code className="mx-1 font-mono text-fg-muted">.env.local</code> first.
        </p>
      </div>
    </main>
  );
}
