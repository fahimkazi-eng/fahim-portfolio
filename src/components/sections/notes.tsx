import { ArrowUpRight } from "lucide-react";
import type { Post } from "@/lib/db/schema";
import {
  PlaceholderNote,
  Section,
  SectionHeading,
} from "@/components/ui/card";
import { SplitText } from "@/components/animations/split-text";

/* ==========================================================================
   Notes (10) — the index. Published posts only; drafts never render here.
   No posts yet is a valid, honest state: the section says so plainly.
   ========================================================================== */

type NotesSectionProps = {
  posts: Pick<Post, "id" | "slug" | "title" | "excerpt" | "createdAt">[];
};

export function NotesSection({ posts }: NotesSectionProps) {
  return (
    <Section id="notes">
      <SectionHeading
        index="/ 10"
        eyebrow="Notes"
        title={<SplitText text="Notes from the build." duration={1} />}
        lede="Short write-ups on the products, the stack and the process. Publishing notes as projects land — every entry is written from the actual build."
      />

      {posts.length === 0 ? (
        <PlaceholderNote>
          No notes published yet — the first write-up is drafted in the admin
          dashboard and will land here. This space is never padded with
          placeholder posts.
        </PlaceholderNote>
      ) : (
        <ol className="border-t border-line">
          {posts.map((post, i) => (
            <li
              key={post.id}
              className="group border-b border-line transition-colors duration-300 hover:bg-surface"
            >
              <a
                href={`/notes/${post.slug}`}
                data-cursor="view"
                className="flex flex-col gap-3 py-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-4">
                    <span className="type-mono text-accent tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="type-display text-h4 tracking-tight text-fg">
                      {post.title}
                    </h3>
                  </div>
                  {post.excerpt ? (
                    <p className="mt-2 max-w-[52ch] text-body leading-relaxed text-fg-muted">
                      {post.excerpt}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-4 pl-9 sm:pl-0">
                  <span className="type-mono text-fg-subtle">
                    {new Date(post.createdAt).toLocaleDateString("en-CA")}
                  </span>
                  <ArrowUpRight
                    className="size-4 text-fg-subtle transition-colors duration-300 group-hover:text-accent"
                    strokeWidth={2}
                  />
                </div>
              </a>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}