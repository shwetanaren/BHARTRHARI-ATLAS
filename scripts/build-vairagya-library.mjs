import { mkdir, writeFile } from "node:fs/promises";

const SOURCE_URL =
  "https://gretil.sub.uni-goettingen.de/gretil/corpustei/transformations/html/sa_bhatRhari-zatakatraya.htm";
const OUTPUT_PATH = new URL("../data/works/vairagya/library.json", import.meta.url);

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

function parseVairagya(html) {
  const marker = html.indexOf("BharSt_3.1");
  const start = html.lastIndexOf("<p", marker);

  if (marker === -1 || start === -1) {
    throw new Error("Could not isolate Vairagya Śataka section in GRETIL source.");
  }

  const section = html.slice(start);
  const paragraphMatches = [...section.matchAll(/<p>\s*(.*?)\s*<\/p>/gs)];
  const verseMatches = paragraphMatches
    .map((match) => {
      const verseMatch = match[1].match(/\|\|\s*BharSt_3\.(\d+)\s*\|\|/);

      if (!verseMatch) {
        return null;
      }

      return {
        number: Number(verseMatch[1]),
        block: match[1].replace(/\|\|\s*BharSt_3\.\d+\s*\|\|/, "").trim()
      };
    })
    .filter(Boolean);

  const verses = verseMatches.map((match) => {
    const number = match.number;
    const lines = cleanLines(match.block);

    return {
      number,
      gretilId: `BharSt_3.${number}`,
      opening: lines[0],
      lines,
      sourceUrl: SOURCE_URL
    };
  });

  if (verses.length !== 100) {
    throw new Error(`Expected 100 Vairāgya verses from GRETIL, found ${verses.length}.`);
  }

  return verses;
}

function serialize(verses) {
  return JSON.stringify(
    {
      meta: {
        work: "Vairāgya Śataka",
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
const verses = parseVairagya(html);

await mkdir(new URL("../data/works/vairagya/", import.meta.url), { recursive: true });
await writeFile(OUTPUT_PATH, serialize(verses), "utf8");
console.log(`Wrote ${verses.length} verses to ${OUTPUT_PATH.pathname}`);
