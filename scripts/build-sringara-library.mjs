import { mkdir, writeFile } from "node:fs/promises";

const SOURCE_URL =
  "https://gretil.sub.uni-goettingen.de/gretil/corpustei/transformations/html/sa_bhatRhari-zatakatraya.htm";
const OUTPUT_PATH = new URL("../data/works/sringara/library.json", import.meta.url);

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

function cleanLines(block) {
  return decodeEntities(block)
    .replaceAll("<br />", "\n")
    .replace(/<[^>]+>/g, " ")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function parseSringara(html) {
  const marker = html.indexOf("BharSt_2.1");
  const end = html.indexOf("BharSt_3.1");
  const start = html.lastIndexOf("<p", marker);

  if (marker === -1 || start === -1 || end === -1) {
    throw new Error("Could not isolate Śṛṅgāra Śataka section in GRETIL source.");
  }

  const section = html.slice(start, end);
  const paragraphMatches = [...section.matchAll(/<p>\s*(.*?)\s*<\/p>/gs)];
  const verseMatches = paragraphMatches
    .map((match) => {
      const verseMatch = match[1].match(/\|\|\s*BharSt_2\.(\d+)\s*\|\|/);

      if (!verseMatch) {
        return null;
      }

      const number = Number(verseMatch[1]);

      if (number > 100) {
        return null;
      }

      return {
        number,
        block: match[1].replace(/\|\|\s*BharSt_2\.\d+\s*\|\|/, "").trim()
      };
    })
    .filter(Boolean);

  const verses = verseMatches.map((match) => {
    const number = match.number;
    const lines = cleanLines(match.block);

    return {
      number,
      gretilId: `BharSt_2.${number}`,
      opening: lines[0],
      lines,
      sourceUrl: SOURCE_URL
    };
  });

  if (verses.length !== 100) {
    throw new Error(`Expected 100 Śṛṅgāra verses from GRETIL, found ${verses.length}.`);
  }

  return verses;
}

function serialize(verses) {
  return JSON.stringify(
    {
      meta: {
        work: "Śṛṅgāra Śataka",
        edition: "GRETIL base edition",
        verseCount: verses.length,
        sourceUrl: SOURCE_URL
      },
      verses
    },
    null,
    2
  );
}

const html = await fetchText(SOURCE_URL);
const verses = parseSringara(html);

await mkdir(new URL("../data/works/sringara/", import.meta.url), { recursive: true });
await writeFile(OUTPUT_PATH, serialize(verses), "utf8");
console.log(`Wrote ${verses.length} verses to ${OUTPUT_PATH.pathname}`);
