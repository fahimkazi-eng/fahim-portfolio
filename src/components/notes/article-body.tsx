import type { ReactNode } from "react";

/* ==========================================================================
   ArticleBody — a deliberately small Markdown subset.

   The admin stores post bodies as plain text. A full Markdown pipeline would
   be a dependency for a handful of posts, so this renders the five things a
   note actually needs and nothing else:

     ##  / ###   headings
     -  / *      bullet lists
     1.          ordered lists
     >           block quotes
     ```         fenced code
     **bold**    inline strong
     `code`      inline code

   Everything is returned as React nodes — no dangerouslySetInnerHTML, so a
   post body can never inject markup.
   ========================================================================== */

/* Inline formatting: **strong** and `code`. */
function inline(text: string, key: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={`${key}-b${i++}`} className="font-semibold text-fg">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      nodes.push(
        <code
          key={`${key}-c${i++}`}
          className="rounded bg-surface-strong px-1.5 py-0.5 font-mono text-[0.85em] text-pulse-300"
        >
          {token.slice(1, -1)}
        </code>,
      );
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const H2 =
  "type-display mt-2 text-h3 tracking-tight text-fg";
const H3 = "font-display mt-2 text-h4 tracking-tight text-fg";
const P = "text-body leading-relaxed text-fg";

export function ArticleBody({ body }: { body: string }) {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let key = 0;

  const para: string[] = [];
  const flushPara = () => {
    if (!para.length) return;
    const text = para.join(" ").trim();
    para.length = 0;
    if (text) blocks.push(<p key={key++} className={P}>{inline(text, `p${key}`)}</p>);
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      flushPara();
      i++;
      continue;
    }

    /* fenced code */
    if (line.trimStart().startsWith("```")) {
      flushPara();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++; // closing fence
      blocks.push(
        <pre
          key={key++}
          className="overflow-x-auto rounded-card border border-line bg-surface p-4 text-[0.8125rem] leading-relaxed"
        >
          <code className="font-mono text-fg-muted">{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    if (line.startsWith("### ")) {
      flushPara();
      blocks.push(<h3 key={key++} className={H3}>{inline(line.slice(4), `h${key}`)}</h3>);
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      flushPara();
      blocks.push(<h2 key={key++} className={H2}>{inline(line.slice(3), `h${key}`)}</h2>);
      i++;
      continue;
    }

    if (line.startsWith("> ")) {
      flushPara();
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quote.push(lines[i].slice(2));
        i++;
      }
      blocks.push(
        <blockquote
          key={key++}
          className="border-l-2 border-accent pl-5 italic text-fg-muted"
        >
          {inline(quote.join(" "), `q${key}`)}
        </blockquote>,
      );
      continue;
    }

    if (/^[-*] /.test(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*] /, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="list-disc space-y-2 pl-5 text-body leading-relaxed text-fg-muted">
          {items.map((item, idx) => (
            <li key={idx}>{inline(item, `li${key}-${idx}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\. /.test(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={key++} className="list-decimal space-y-2 pl-5 text-body leading-relaxed text-fg-muted">
          {items.map((item, idx) => (
            <li key={idx}>{inline(item, `oli${key}-${idx}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    para.push(line);
    i++;
  }

  flushPara();

  return <div className="space-y-6">{blocks}</div>;
}
