import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/db/queries";
import { ArticleBody } from "@/components/notes/article-body";
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

        <div className="[&>div>p:first-child]:first-letter:float-left [&>div>p:first-child]:first-letter:mr-3 [&>div>p:first-child]:first-letter:text-h3 [&>div>p:first-child]:first-letter:font-display [&>div>p:first-child]:first-letter:text-accent">
          <ArticleBody body={post.body} />
        </div>

        <hr className="my-10 border-line" />

        <nav
          aria-label="Article"
          className="flex flex-wrap items-center gap-3"
        >
          <Link
            href="/#notes"
            className="type-mono text-accent underline-offset-4 hover:underline"
          >
            ← Back to notes
          </Link>
          <span aria-hidden="true" className="text-fg-subtle">
            /
          </span>
          <Link
            href="/"
            className="type-mono text-fg-muted underline-offset-4 hover:text-fg hover:underline"
          >
            Home
          </Link>
        </nav>
      </article>
    </main>
  );
}