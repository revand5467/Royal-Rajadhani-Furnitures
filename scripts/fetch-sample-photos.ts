/**
 * Sample photography pipeline.
 *
 * The seed catalogue ships with real, licence-clear photographs committed under
 * `public/samples`, so the demo never depends on a live third-party CDN and no
 * image link can break. Sources are the CC0 collections indexed by Openverse
 * (StockSnap, Rawpixel, …) plus Wikimedia Commons as a fallback.
 *
 *   bun run photos:fetch          # gather candidates + write a contact sheet
 *   bun run photos:pick 4 9 12    # download the chosen candidates
 *
 * `pick` writes `public/samples/piece-NN.jpg` (max 1600px, ~200 KB each) and a
 * `credits.json` recording the creator, licence and source page for every file,
 * which `prisma/seed.ts` reads when it builds the sample listings.
 *
 * Replace the output with your own shop photography at any time — the seed only
 * records URLs, so uploading through the admin area is the normal workflow.
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(ROOT, ".cache", "samples");
const THUMBS = path.join(CACHE, "thumbs");
const OUT = path.join(ROOT, "public", "samples");
const CANDIDATES = path.join(CACHE, "candidates.json");
const UA = "FurnitureShowcaseSampleBuilder/1.0 (local development seed assets)";

const QUERIES: Array<{ q: string; group: string }> = [
  { q: "sofa living room", group: "seating" },
  { q: "modern sofa interior", group: "seating" },
  { q: "armchair living room", group: "seating" },
  { q: "lounge chair interior", group: "seating" },
  { q: "dining table chairs", group: "dining" },
  { q: "wooden table interior", group: "dining" },
  { q: "coffee table living room", group: "tables" },
  { q: "sideboard cabinet interior", group: "storage" },
  { q: "bookshelf living room", group: "storage" },
  { q: "bedroom bed interior", group: "bedroom" },
  { q: "desk workspace home office", group: "office" },
  { q: "floor lamp interior", group: "lighting" },
  { q: "interior design living room", group: "interiors" },
  { q: "minimalist interior home", group: "interiors" },
  { q: "nordic interior apartment", group: "interiors" },
  { q: "kitchen dining interior", group: "interiors" },
  { q: "home decor plant interior", group: "interiors" },
  { q: "reading corner chair", group: "interiors" },
];

const SOURCES = ["stocksnap", "rawpixel"] as const;

type Candidate = {
  index: number;
  group: string;
  query: string;
  title: string;
  creator: string;
  license: string;
  source: string;
  landing: string;
  url: string;
  width: number;
  height: number;
  file?: string;
  thumb?: string;
  failure?: string;
};

async function fetchJson<T>(url: string, attempts = 3): Promise<T | null> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": UA, accept: "application/json" },
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) return (await res.json()) as T;
    } catch {
      // fall through to the retry
    }
    await new Promise((resolve) => setTimeout(resolve, 900 * (attempt + 1)));
  }
  return null;
}

async function download(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return null;
    if (!(res.headers.get("content-type") ?? "").startsWith("image/")) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    return buffer.byteLength > 8_000 ? buffer : null;
  } catch {
    return null;
  }
}

async function openverse(query: string, source: string) {
  const url =
    "https://api.openverse.org/v1/images/?" +
    new URLSearchParams({
      q: query,
      page_size: "30",
      license: "cc0,pdm",
      source,
      size: "large",
      mature: "false",
    }).toString();
  const data = await fetchJson<{ results: any[] }>(url);
  return (data?.results ?? []).map((result) => ({
    title: result.title ?? "Untitled",
    creator: result.creator ?? "Unknown",
    license: `${(result.license ?? "").toUpperCase()} ${result.license_version ?? ""}`.trim(),
    source: result.source ?? source,
    landing: result.foreign_landing_url ?? result.url,
    url: result.url as string,
    width: result.width ?? 0,
    height: result.height ?? 0,
  }));
}

async function commons(query: string) {
  const url =
    "https://commons.wikimedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: `filetype:bitmap ${query}`,
      gsrlimit: "10",
      gsrnamespace: "6",
      prop: "imageinfo",
      iiprop: "url|size|extmetadata",
      iiurlwidth: "1600",
      format: "json",
    }).toString();
  const data = await fetchJson<{ query?: { pages?: Record<string, any> } }>(url);
  const pages = data?.query?.pages ?? {};
  return Object.values(pages)
    .map((page: any) => {
      const info = page.imageinfo?.[0];
      if (!info) return null;
      const meta = info.extmetadata ?? {};
      const strip = (value?: string) => (value ? String(value).replace(/<[^>]+>/g, "").trim() : "");
      return {
        title: String(page.title).replace(/^File:/, ""),
        creator: strip(meta.Artist?.value) || "Unknown",
        license: strip(meta.LicenseShortName?.value) || "See source",
        source: "wikimedia",
        landing: String(info.descriptionurl),
        url: (info.thumburl ?? info.url) as string,
        width: info.thumbwidth ?? info.width ?? 0,
        height: info.thumbheight ?? info.height ?? 0,
      };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value));
}

async function fetchCandidates() {
  await rm(CACHE, { recursive: true, force: true });
  await mkdir(THUMBS, { recursive: true });

  const seen = new Set<string>();
  const candidates: Candidate[] = [];
  const perQuery = 10;

  for (const { q, group } of QUERIES) {
    const found: Array<Awaited<ReturnType<typeof openverse>>[number]> = [];
    for (const source of SOURCES) {
      found.push(...(await openverse(q, source)));
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (found.length < 4) found.push(...(await commons(q)));

    let kept = 0;
    for (const candidate of found) {
      if (kept >= perQuery) break;
      if (!candidate.url || seen.has(candidate.url)) continue;
      if (candidate.width && candidate.width < 1100) continue;
      seen.add(candidate.url);

      const index = candidates.length + 1;
      const entry: Candidate = { index, group, query: q, ...candidate };
      candidates.push(entry);

      const buffer = await download(candidate.url);
      if (!buffer) {
        entry.failure = "download failed";
        continue;
      }
      try {
        const thumb = await sharp(buffer).resize(420, 300, { fit: "cover" }).jpeg({ quality: 72 }).toBuffer();
        await writeFile(path.join(THUMBS, `${index}.jpg`), thumb);
        await writeFile(path.join(CACHE, `${index}.jpg`), buffer);
        entry.thumb = `${index}.jpg`;
        entry.file = `${index}.jpg`;
        kept += 1;
      } catch {
        entry.failure = "unsupported image";
      }
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    console.log(`${q}: kept ${kept} (${found.length} found)`);
  }

  await writeFile(CANDIDATES, JSON.stringify(candidates, null, 2));
  await writeContactSheet(candidates);
  console.log(`\n${candidates.length} candidates, ${candidates.filter((c) => c.file).length} usable`);
  console.log("Review .cache/samples/contact-sheet.html, then run: bun run photos:pick <indices…>");
}

async function writeContactSheet(candidates: Candidate[]) {
  const tiles: string[] = [];
  for (const candidate of candidates) {
    if (!candidate.thumb) continue;
    const data = (await readFile(path.join(THUMBS, candidate.thumb))).toString("base64");
    tiles.push(`<figure>
  <div class="frame"><img src="data:image/jpeg;base64,${data}" alt=""><span class="idx">${candidate.index}</span></div>
  <figcaption><strong>${escapeHtml(candidate.title.slice(0, 64))}</strong>
  <em>${escapeHtml(candidate.source)} · ${escapeHtml(candidate.license)} · ${candidate.width}×${candidate.height}</em>
  <span>${escapeHtml(candidate.group)} — ${escapeHtml(candidate.query)}</span></figcaption>
</figure>`);
  }

  await writeFile(
    path.join(CACHE, "contact-sheet.html"),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Sample photo candidates</title>
<style>
  body{background:#141414;color:#f2efe9;font:13px/1.45 ui-sans-serif,system-ui,sans-serif;margin:0;padding:16px}
  h1{font-size:14px;font-weight:500;margin:0 0 14px;color:#9c9c9c}
  .grid{display:grid;grid-template-columns:repeat(5,1fr);gap:11px}
  figure{margin:0;background:#1e1e1e;border:1px solid #333}
  .frame{position:relative;aspect-ratio:7/5;background:#000}
  img{width:100%;height:100%;object-fit:cover;display:block}
  .idx{position:absolute;left:0;top:0;background:#c2410c;color:#fff;font-weight:700;padding:2px 7px}
  figcaption{padding:6px 8px;display:flex;flex-direction:column;gap:2px}
  figcaption strong{font-weight:500;font-size:12px} figcaption em{color:#9c9c9c;font-style:normal;font-size:10px}
  figcaption span{color:#6f6f6f;font-size:10px}
</style></head><body>
<h1>${tiles.length} candidates — pick the numbers you want, then run <code>bun run photos:pick &lt;n&gt; …</code></h1>
<div class="grid">${tiles.join("")}</div>
</body></html>`,
  );
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]!);
}

async function pick(indices: number[]) {
  const candidates: Candidate[] = JSON.parse(await readFile(CANDIDATES, "utf8"));
  const chosen = indices.map((index) => candidates.find((candidate) => candidate.index === index && candidate.file));
  const usable = chosen.filter((candidate): candidate is Candidate => Boolean(candidate));
  if (!usable.length) throw new Error("None of those indices are usable — run `fetch` first.");

  await mkdir(OUT, { recursive: true });
  const credits: Array<Record<string, unknown>> = [];

  for (const [position, candidate] of usable.entries()) {
    const source = await readFile(path.join(CACHE, candidate.file!));
    const name = `piece-${String(position + 1).padStart(2, "0")}.jpg`;
    await sharp(source)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 74, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toFile(path.join(OUT, name));

    const meta = await sharp(path.join(OUT, name)).metadata();
    credits.push({
      file: `/samples/${name}`,
      title: candidate.title,
      creator: candidate.creator,
      license: candidate.license,
      source: candidate.source,
      sourceUrl: candidate.landing,
      width: meta.width,
      height: meta.height,
      group: candidate.group,
      query: candidate.query,
    });
    console.log(`wrote /samples/${name} (${meta.width}×${meta.height}) — ${candidate.title.slice(0, 48)}`);
  }

  await writeFile(path.join(OUT, "credits.json"), `${JSON.stringify(credits, null, 2)}\n`);
  console.log(`\n${usable.length} images written to public/samples, credits.json updated`);
}

const [command, ...args] = process.argv.slice(2);
if (command === "fetch") {
  await fetchCandidates();
} else if (command === "pick") {
  const indices = args.map((value) => Number.parseInt(value, 10)).filter((value) => Number.isFinite(value));
  if (!indices.length) throw new Error("usage: bun run photos:pick <index> [index…]");
  await pick(indices);
} else {
  console.log("usage: fetch | pick <index…>");
}
