import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/db/queries";
import { site } from "@/lib/site";

export const revalidate = 60;

type NotesPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: NotesPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} · Notes · ${site.name}`,
    description: post.excerpt ?? undefined,
  };
}

export default async function NotesPostPage({ params }: NotesPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const paragraphs = post.body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <main id="main" className="gutter shell py-[clamp(2.5rem,6vw,5.5rem)]">
      <article className="mx-auto max-w-[52rem]">
        <p className="type-mono text-[0.6875rem] text-fg-subtle">
          Notes · {new Date(post.createdAt).toLocaleDateString("en-CA")}
        </p>
        <h1 className="type-display mt-3 text-h1 tracking-tight text-fg">
          {post.title}
        </h1>
        {post.excerpt ? (
          <p className="mt-6 max-w-[52ch] text-lead text-fg-muted">
            {post.excerpt}
          </p>
        ) : null}

        <hr className="my-10 border-line" />

        <div className="space-y-6">
          {paragraphs.map((paragraph, i) => (
            <p
              key={i}
              className="text-body leading-relaxed text-fg [&:first-child]:first-letter:float-left [&:first-child]:first-letter:mr-3 [&:first-child]:first-letter:text-h3 [&:first-child]:first-letter:font-display [&:first-child]:first-letter:text-accent"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </main>
  );
}