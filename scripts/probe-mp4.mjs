/**
 * Minimal MP4 (ISO-BMFF) inspector, for verifying a recording before it is
 * published to the site.
 *
 * Reports, per track: handler type, codec fourcc, AVC profile/level, coded and
 * display dimensions, and duration. Also reports whether the file carries an
 * audio track, and whether `moov` precedes `mdat` (faststart), which decides
 * whether a browser can render the first frame without fetching the whole
 * file.
 *
 *   node scripts/probe-mp4.mjs public/projects/unimate-demo.mp4
 */
import { open } from "node:fs/promises";

/**
 * Boxes that hold other boxes with nothing in between. Codec sample entries
 * (`avc1`, `mp4a`, …) are deliberately absent: they prefix a fixed-size
 * header before their children, and the only one worth reading is the decoder
 * configuration record, which is addressed by offset below rather than by
 * descending. `stsd` is a container but prefixes an 8-byte entry count.
 */
const PURE_CONTAINERS = new Set([
  "moov", "trak", "mdia", "minf", "stbl", "edts", "dinf", "udta", "mvex",
  "moof", "traf", "mfra", "sinf", "schi", "wave",
]);

/** Byte offset from a box's body to its first child, for prefixed containers. */
const PREFIXED = { stsd: 8 };

function* walk(buf, start, end, path = []) {
  let p = start;
  while (p + 8 <= end) {
    let size = buf.readUInt32BE(p);
    const type = buf.toString("latin1", p + 4, p + 8);
    let header = 8;
    if (size === 1) {
      if (p + 16 > end) return;
      size = Number(buf.readBigUInt64BE(p + 8));
      header = 16;
    } else if (size === 0) {
      size = end - p;
    }
    if (size < header || p + size > end) return;
    const box = { type, start: p, end: p + size, body: p + header, path: [...path, type] };
    yield box;

    const skip = PREFIXED[type];
    if (skip !== undefined) {
      yield* walk(buf, box.body + skip, box.end, box.path);
    } else if (PURE_CONTAINERS.has(type)) {
      yield* walk(buf, box.body, box.end, box.path);
    }
    p += size;
  }
}

const codecName = (fourcc) =>
  ({
    avc1: "H.264 / AVC",
    avc3: "H.264 / AVC (in-band SPS)",
    hev1: "H.265 / HEVC",
    hvc1: "H.265 / HEVC",
    vp09: "VP9",
    av01: "AV1",
    mp4a: "AAC",
  })[fourcc] ?? fourcc;

/** AVC `profile_idc` values. High (100) is universally supported. */
const PROFILES = {
  66: "Baseline",
  77: "Main",
  88: "Extended",
  100: "High",
  110: "High 10",
  122: "High 4:2:2",
  244: "High 4:4:4",
};

async function probe(file) {
  const fh = await open(file, "r");
  try {
    const { size: fileSize } = await fh.stat();
    const buf = Buffer.alloc(fileSize);
    // FileHandle.read is not guaranteed to fill the buffer in one call, so
    // loop until it is full. A short read silently truncates the box tree.
    let filled = 0;
    while (filled < fileSize) {
      const { bytesRead } = await fh.read(buf, filled, fileSize - filled, filled);
      if (bytesRead === 0) break;
      filled += bytesRead;
    }

    const boxes = [...walk(buf, 0, fileSize)];
    const order = boxes.filter((b) => b.path.length === 1).map((b) => b.type);
    const moovIdx = order.indexOf("moov");
    const mdatIdx = order.indexOf("mdat");
    const faststart = mdatIdx > -1 && (moovIdx > -1 ? moovIdx < mdatIdx : true);

    const movie = boxes.find((b) => b.type === "moov");
    if (!movie) return { file, error: "no moov box (not a progressive MP4?)" };

    // mvhd and mdhd share a layout:
    //   v0: version+flags(4) ctime(4) mtime(4) timescale(4) duration(4)
    //   v1: version+flags(4) ctime(8) mtime(8) timescale(4) duration(8)
    const timeFields = (b) => {
      const v = buf.readUInt8(b.body);
      const tsAt = b.body + (v === 1 ? 20 : 12);
      const duAt = tsAt + 4;
      const timescale = buf.readUInt32BE(tsAt);
      const duration =
        v === 1 ? Number(buf.readBigUInt64BE(duAt)) : buf.readUInt32BE(duAt);
      return timescale ? duration / timescale : null;
    };

    // --- movie timescale / duration -------------------------------
    const mvhd = [...walk(buf, movie.body, movie.end)].find((b) => b.type === "mvhd");
    const movieSec = mvhd ? timeFields(mvhd) : null;

    // --- per track ------------------------------------------------
    const traks = [];
    // `path` records the box types above this one, so a direct child of `moov`
    // has path[0] === "moov".
    for (const trak of boxes.filter((b) => b.type === "trak" && b.path[0] === "moov")) {
      const kids = [...walk(buf, trak.body, trak.end)];
      const tkhd = kids.find((b) => b.type === "tkhd");
      const mdhd = kids.find((b) => b.type === "mdhd");
      const hdlr = kids.find((b) => b.type === "hdlr");

      const trackId = tkhd ? buf.readUInt32BE(tkhd.body + (buf.readUInt8(tkhd.body) === 1 ? 20 : 12)) : null;

      let handler = null;
      if (hdlr) handler = buf.toString("latin1", hdlr.body + 8, hdlr.body + 12);

      let durSec = null;
      if (mdhd) durSec = timeFields(mdhd);

      let width = null;
      let height = null;
      if (tkhd) {
        // tkhd ends with a fixed-size display matrix, so the last 8 bytes of the
        // box are width/height as 16.16 fixed point.
        const dimsAt = tkhd.end - 8;
        width = buf.readUInt32BE(dimsAt) / 65536;
        height = buf.readUInt32BE(dimsAt + 4) / 65536;
      }

      // stsd → sample entry gives the coded pixel size + codec
      let codec = null;
      let codedW = null;
      let codedH = null;
      let profile = null;
      let level = null;
      const stsd = kids.find((b) => b.type === "stsd");
      if (stsd) {
        const entry = [...walk(buf, stsd.body + 8, stsd.end)][0];
        if (entry) {
          codec = entry.type;
          codedW = buf.readUInt16BE(entry.body + 24);
          codedH = buf.readUInt16BE(entry.body + 26);

          // A VisualSampleEntry's child boxes start 78 bytes in, and `avcC`
          // holds the AVC decoder configuration record. profile_idc/level_idc
          // decide which browsers can decode the stream at all.
          const avcC = [...walk(buf, entry.body + 78, entry.end)].find(
            (b) => b.type === "avcC" || b.type === "hvcC" || b.type === "vpcC" || b.type === "av1C",
          );
          if (avcC && avcC.type === "avcC") {
            profile = buf.readUInt8(avcC.body + 1);
            level = buf.readUInt8(avcC.body + 3);
          }
        }
      }

      traks.push({
        trackId,
        handler,
        kind: handler === "vide" ? "video" : handler === "soun" ? "audio" : handler ?? "unknown",
        codec: codec ? codecName(codec) : null,
        avcProfile: profile == null ? null : `${PROFILES[profile] ?? profile}`,
        avcLevel: level == null ? null : `${(level / 10).toFixed(1)}`,
        codedSize: codedW && codedH ? `${codedW}x${codedH}` : null,
        displaySize: width && height ? `${width}x${height}` : null,
        durationSec: durSec == null ? null : Math.round(durSec * 1000) / 1000,
      });
    }

    const v = traks.find((t) => t.kind === "video");
    return {
      file,
      fileSizeMB: Math.round((fileSize / 1024 / 1024) * 100) / 100,
      brand: buf.toString("latin1", 8, 12),
      topLevelBoxes: order,
      faststart,
      movieDurationSec: movieSec == null ? null : Math.round(movieSec * 100) / 100,
      video: v
        ? {
            codec: v.codec,
            avcProfile: v.avcProfile,
            avcLevel: v.avcLevel,
            size: v.codedSize ?? v.displaySize,
            displaySize: v.displaySize,
            durationSec: v.durationSec,
            aspectRatio:
              v.codedSize && v.codedSize.includes("x")
                ? (() => {
                    const [w, h] = v.codedSize.split("x").map(Number);
                    return Math.round((w / h) * 1000) / 1000;
                  })()
                : null,
          }
        : null,
      audio: traks.some((t) => t.kind === "audio"),
      tracks: traks,
    };
  } finally {
    await fh.close();
  }
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: node scripts/probe-mp4.mjs <file.mp4> [...]");
  process.exit(1);
}
for (const f of files) {
  try {
    console.log(JSON.stringify(await probe(f), null, 2));
  } catch (e) {
    console.log(JSON.stringify({ file: f, error: e.message }, null, 2));
  }
}
