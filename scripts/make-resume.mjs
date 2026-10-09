/**
 * Generates `public/resume.pdf` — a real one-page resume built ONLY from the
 * facts already stored in the database (education, experience, featured
 * projects) plus the owner's identity in `src/lib/site.ts`.
 *
 * No PDF library: the document is small and fixed, so it is written as raw
 * PDF with a Helvetica core font. That keeps the repo dependency-free and the
 * output byte-for-byte deterministic.
 *
 *   npm run resume:build
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

/* ---- minimal .env.local loader (mirrors scripts/seed.mjs) ---- */
function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

loadEnv();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is missing. Add it to .env.local first.");
  process.exit(1);
}
const sql = neon(url);

/* --------------------------------------------------------------------------
   PDF primitives
   -------------------------------------------------------------------------- */

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 52;
const CONTENT_W = PAGE_W - MARGIN * 2;

const INK = [0.05, 0.07, 0.13];
const MUTED = [0.42, 0.46, 0.55];
const ACCENT = [0.28, 0.48, 1];

/** Fold anything outside WinAnsi/ASCII to safe ASCII so byte offsets hold. */
function ascii(str) {
  return String(str ?? "")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u00b7/g, "  |  ")
    .replace(/\u2022/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "");
}

function escapeText(str) {
  return ascii(str).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Greedy word wrap using an average glyph width; conservative on purpose. */
function wrap(text, size, factor = 0.55, width = CONTENT_W) {
  const max = Math.max(12, Math.floor(width / (size * factor)));
  const words = ascii(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (!line) {
      line = word;
    } else if ((line + " " + word).length <= max) {
      line += " " + word;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** The content stream is a list of small drawing ops accumulated here. */
const ops = [];
const rgb = (c) => `${c[0]} ${c[1]} ${c[2]}`;

function drawText(x, y, str, { size = 10, bold = false, color = INK } = {}) {
  ops.push(
    `BT /${bold ? "F2" : "F1"} ${size} Tf ${rgb(color)} rg ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapeText(str)}) Tj ET`,
  );
}

function drawRule(x, y, w, { color = ACCENT, width = 0.8 } = {}) {
  ops.push(
    `${width} w ${rgb(color)} RG ${x.toFixed(2)} ${y.toFixed(2)} m ${(x + w).toFixed(2)} ${y.toFixed(2)} l S`,
  );
}

/* --------------------------------------------------------------------------
   Document composition
   -------------------------------------------------------------------------- */

let cursor = PAGE_H - MARGIN;

function section(title) {
  cursor -= 24;
  drawText(MARGIN, cursor, title.toUpperCase(), { size: 10, bold: true, color: INK });
  cursor -= 7;
  drawRule(MARGIN, cursor, CONTENT_W, { color: ACCENT, width: 0.9 });
  cursor -= 17;
}

function bodyLines(lines, { size = 9.5, leading = 13, color = INK, x = MARGIN } = {}) {
  for (const line of lines) {
    drawText(x, cursor, line, { size, color });
    cursor -= leading;
  }
}

function entry(title, meta, detail) {
  drawText(MARGIN, cursor, title, { size: 10.5, bold: true, color: INK });
  cursor -= 13;
  if (meta) {
    drawText(MARGIN, cursor, meta, { size: 9, color: MUTED });
    cursor -= 13;
  }
  if (detail) {
    bodyLines(wrap(detail, 9.5), { size: 9.5, leading: 13, color: INK });
  }
  cursor -= 4;
}

function main(experiences, educations, projects, skills) {
  /* ---- header ---- */
  drawText(MARGIN, cursor, "Kazi Fahim", { size: 23, bold: true, color: INK });
  cursor -= 20;
  drawText(MARGIN, cursor, "CSE Student  |  Software & Web Developer", {
    size: 10.5,
    color: MUTED,
  });
  cursor -= 15;
  drawText(
    MARGIN,
    cursor,
    "fahimirfan867@gmail.com  |  Dhaka, Bangladesh  |  github.com/fahimkazi-eng  |  linkedin.com/in/kazi-fahim-eng621",
    { size: 9, color: MUTED },
  );
  cursor -= 12;
  drawRule(MARGIN, cursor, CONTENT_W, { color: ACCENT, width: 1.4 });

  /* ---- summary ---- */
  section("Summary");
  bodyLines(
    wrap(
      "Computer Science & Engineering student at Northern University Bangladesh (2023-2027) building full-stack web products end to end - schema, server and interface. Works across Next.js, TypeScript and PostgreSQL, with a focus on interactive, product-minded front ends.",
      9.5,
    ),
  );

  /* ---- education ---- */
  if (educations.length) {
    section("Education");
    for (const edu of educations) {
      const years = edu.current
        ? `${edu.startYear}-Present`
        : `${edu.startYear}-${edu.endYear}`;
      entry(
        edu.degree,
        `${edu.institution}  |  ${years}`,
        edu.description && edu.description.length < 220 ? edu.description : null,
      );
    }
  }

  /* ---- experience ---- */
  if (experiences.length) {
    section("Experience");
    for (const exp of experiences) {
      const years = exp.current
        ? `${exp.startDate}-Present`
        : `${exp.startDate}${exp.endDate ? `-${exp.endDate}` : ""}`;
      const meta = [exp.organization, exp.location, years].filter(Boolean).join("  |  ");
      entry(exp.role, meta, exp.description || null);
    }
  }

  /* ---- selected projects ---- */
  if (projects.length) {
    section("Selected Projects");
    for (const p of projects) {
      entry(p.title, p.tagline || null, p.summary || null);
      if (Array.isArray(p.tech) && p.tech.length) {
        drawText(MARGIN, cursor, `Stack: ${p.tech.join(", ")}`, {
          size: 9,
          color: MUTED,
        });
        cursor -= 13;
      }
      const link = p.liveUrl || p.repoUrl;
      if (link) {
        drawText(MARGIN, cursor, link, { size: 9, color: ACCENT });
        cursor -= 13;
      }
      cursor -= 4;
    }
  }

  /* ---- skills ---- */
  if (skills.length || projects.length) {
    section("Skills");
    const techUsed = [
      ...new Set(projects.flatMap((p) => (Array.isArray(p.tech) ? p.tech : []))),
    ];
    if (techUsed.length) {
      bodyLines([`Technical:  ${techUsed.join(", ")}`]);
    }
    const professional = skills.filter((s) => s.category === "Professional");
    const other = skills.filter((s) => s.category !== "Professional");
    if (other.length) {
      bodyLines([`Other:  ${other.map((s) => s.name).join(", ")}`]);
    }
    if (professional.length) {
      bodyLines([`Professional:  ${professional.map((s) => s.name).join(", ")}`]);
    }
  }
}

/* --------------------------------------------------------------------------
   Wire the PDF objects together and emit the file
   -------------------------------------------------------------------------- */

function buildPdf(contentStream) {
  const objects = [];
  const push = (body) => {
    objects.push(body);
    return objects.length; // 1-based object number
  };

  const catalogNo = push("<< /Type /Catalog /Pages 2 0 R >>");
  // pages object is reserved as #2 regardless of order
  const pagesNo = 2;
  const pageNo = 3;
  const contentNo = 4;
  const fontRegular = 5;
  const fontBold = 6;

  // Rebuild in the exact order matching the reserved numbers.
  const byNumber = [];
  byNumber[catalogNo] = "<< /Type /Catalog /Pages 2 0 R >>";
  byNumber[pagesNo] = `<< /Type /Pages /Kids [${pageNo} 0 R] /Count 1 >>`;
  byNumber[pageNo] =
    `<< /Type /Page /Parent ${pagesNo} 0 R /MediaBox [0 0 ${PAGE_W.toFixed(2)} ${PAGE_H.toFixed(2)}] ` +
    `/Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> ` +
    `/Contents ${contentNo} 0 R >>`;
  byNumber[contentNo] =
    `<< /Length ${Buffer.byteLength(contentStream, "latin1")} >>\nstream\n${contentStream}\nendstream`;
  byNumber[fontRegular] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  byNumber[fontBold] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

  const count = byNumber.length - 1; // objects are 1..count

  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [];
  for (let i = 1; i <= count; i++) {
    offsets[i] = Buffer.byteLength(pdf, "latin1");
    pdf += `${i} 0 obj\n${byNumber[i]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${count + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= count; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${count + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "latin1");
}

async function run() {
  const experiences = await sql.query(
    "SELECT role, organization, location, start_date AS \"startDate\", end_date AS \"endDate\", current, description FROM experiences ORDER BY sort_order, id",
  );
  const educations = await sql.query(
    "SELECT degree, institution, location, start_year AS \"startYear\", end_year AS \"endYear\", current, description FROM educations ORDER BY sort_order, id",
  );
  const projects = await sql.query(
    "SELECT title, tagline, summary, tech, live_url AS \"liveUrl\", repo_url AS \"repoUrl\" FROM projects WHERE featured = true AND published = true ORDER BY sort_order, id",
  );
  const skills = await sql.query(
    "SELECT name, category FROM skills ORDER BY category, sort_order, id",
  );

  main(experiences, educations, projects, skills);

  const pdf = buildPdf(ops.join("\n"));

  const dir = "public";
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/resume.pdf`, pdf);
  console.log(`Wrote public/resume.pdf (${pdf.length} bytes)`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
