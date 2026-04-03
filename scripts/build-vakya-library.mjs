import { mkdir, writeFile } from "node:fs/promises";

const SOURCE_URL =
  "https://gretil.sub.uni-goettingen.de/gretil/1_sanskr/6_sastra/1_gram/vakyp_pu.htm";
const OUTPUT_PATH = new URL("../data/works/vakya/library.json", import.meta.url);

function fetchText(url) {
  return fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0"
    }
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    return response.text();
  });
}

function decodeEntities(text) {
  return text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&nbsp;", " ");
}

function cleanTextLine(line) {
  return line.replace(/\s+/g, " ").trim();
}

function cleanVerseLine(line) {
  return cleanTextLine(line.replace(/\s*\/+\s*$/, ""));
}

function parseVakya(html) {
  const text = decodeEntities(html)
    .replaceAll("<BR>", "\n")
    .replaceAll("<br>", "\n")
    .replace(/<[^>]+>/g, "\n");

  const lines = text.split("\n").map(cleanTextLine).filter(Boolean);
  const verses = [];

  let started = false;
  let buffer = [];
  let currentBook = null;
  let currentBookTitle = null;
  let currentSection = null;
  let currentSectionTitle = null;

  for (const line of lines) {
    const bookMatch = line.match(/^([123])\.\s*(.+kāṇḍam)$/i);
    if (bookMatch) {
      started = true;
      buffer = [];
      currentBook = Number(bookMatch[1]);
      currentBookTitle = bookMatch[2];
      currentSection = null;
      currentSectionTitle = null;
      continue;
    }

    if (!started) {
      continue;
    }

    const sectionMatch = line.match(/^(\d+\.\d+)\.?\s*(.+samuddeśaḥ)$/i);
    if (sectionMatch) {
      buffer = [];
      currentSection = sectionMatch[1];
      currentSectionTitle = sectionMatch[2];
      continue;
    }

    if (/^\/\/\s*iti\b/i.test(line)) {
      buffer = [];
      continue;
    }

    const verseMatch = line.match(/^(.*?)\s*\/\/\s*([0-9]+(?:\.[0-9]+){1,2})\s*\/\/$/);
    if (verseMatch) {
      const lineBody = cleanVerseLine(verseMatch[1]);
      const number = verseMatch[2];
      const parts = number.split(".");
      const book = Number(parts[0]);
      const section = parts.length === 3 ? `${parts[0]}.${parts[1]}` : null;
      const verseLines = [...buffer, lineBody].map(cleanVerseLine).filter(Boolean);

      if (!verseLines.length) {
        throw new Error(`No verse lines found for Vākyapadīya ${number}.`);
      }

      verses.push({
        number,
        gretilId: `VP_${number}`,
        opening: verseLines[0],
        lines: verseLines,
        book,
        bookTitle: currentBookTitle,
        section,
        sectionTitle: section ? currentSectionTitle : null,
        sourceUrl: SOURCE_URL
      });

      buffer = [];
      continue;
    }

    if (line.startsWith("//")) {
      continue;
    }

    buffer.push(line);
  }

  if (verses.length !== 1096) {
    throw new Error(`Expected 1096 Vākyapadīya entries from GRETIL, found ${verses.length}.`);
  }

  return verses;
}

function serialize(verses) {
  return JSON.stringify(
    {
      meta: {
        work: "Vākyapadīya",
        edition: "GRETIL Rau-based text (1.1–3.7)",
        verseCount: verses.length,
        sourceUrl: SOURCE_URL,
        scopeNote:
          "This library follows the GRETIL Rau-based text covering books 1, 2, and book 3 through the Sādhanasamuddeśa (3.7)."
      },
      verses
    },
    null,
    2
  );
}

const html = await fetchText(SOURCE_URL);
const verses = parseVakya(html);

await mkdir(new URL("../data/works/vakya/", import.meta.url), { recursive: true });
await writeFile(OUTPUT_PATH, serialize(verses), "utf8");
console.log(`Wrote ${verses.length} entries to ${OUTPUT_PATH.pathname}`);
