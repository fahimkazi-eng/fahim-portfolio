import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectBySlug, getPublishedProjects } from "@/lib/db/queries";
import { CaseStudy } from "@/components/sections/case-study";
import { Footer } from "@/components/sections/footer";
import { FloatingNav } from "@/components/ui/nav";
import { buildBreadcrumbs, buildProjectSchema } from "@/lib/seo";
import { site } from "@/lib/site";

/* ==========================================================================
   /work/[slug] — the full case study.
   Statically generated for published projects; revalidated on every admin
   save through `revalidatePath("/")` in the server actions.
   ========================================================================== */

type Props = { params: Promise<{ slug: string }> };

/**
 * Only the slugs that exist at build time are prerendered. `dynamicParams`
 * stays at its default (true) so a project published from the admin dashboard
 * is reachable immediately — the page is generated on first request and then
 * cached by the revalidate window.
 */
export async function generateStaticParams() {
  const projects = await getPublishedProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  /* Thrown here as well as in the body so the title block is never populated
     from a project that does not exist.

     Note the HTTP status for a missing case study is still 200, not 404.
     That is Next.js streaming, documented and unavoidable once the response
     has begun flushing — see the "Status Codes" section of the `loading`
     file convention. Next compensates by injecting
     `<meta name="robots" content="noindex">`, which is what actually keeps
     a missing slug out of search results. Do not read the 200 here as a bug
     and do not add a second data fetch to try to work around it. */
  if (!project) notFound();

  const description =
    project.summary ??
    project.tagline ??
    `A case study of ${project.title} by ${site.name}.`;

  return {
    title: project.title,
    description,
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: {
      type: "article",
      title: `${project.title} — ${site.name}`,
      description,
      url: `/work/${project.slug}`,
      images: project.imageUrl ? [{ url: project.imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} — ${site.name}`,
      description,
      images: project.imageUrl ? [project.imageUrl] : undefined,
    },
  };
}

export default async function WorkDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const all = await getPublishedProjects();
  const index = all.findIndex((p) => p.id === project.id);
  const next = index >= 0 ? (all[index + 1] ?? all[0] ?? null) : null;
  const isOnlyProject = all.length <= 1;

  const jsonLd = [
    buildProjectSchema(project),
    buildBreadcrumbs([
      { name: "Home", href: "/" },
      { name: "Work", href: "/#work" },
      { name: project.title, href: `/work/${project.slug}` },
    ]),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FloatingNav />
      <main id="main">
        <CaseStudy project={project} next={isOnlyProject ? null : next} />
      </main>
      <Footer />
    </>
  );
}
