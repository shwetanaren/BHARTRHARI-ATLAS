import { mkdir, writeFile } from "node:fs/promises";

const SOURCE_URL =
  "https://gretil.sub.uni-goettingen.de/gretil/corpustei/transformations/html/sa_bhatRhari-zatakatraya.htm";
const OUTPUT_PATH = new URL("../data/works/niti/library.json", import.meta.url);

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
    .filter(Boolean)
    .filter((line) => line !== "nīti-śatakam" && line !== "bhartṛhareḥ");
}

function parseNiti(html) {
  const start = html.indexOf("nīti-śatakam");
  const end = html.indexOf("BharSt_2.1");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Could not isolate Nīti Śataka section in GRETIL source.");
  }

  const section = html.slice(start, end);
  const verseNumbers = [...section.matchAll(/BharSt_1\.(\d+)/g)].map((match) =>
    Number(match[1])
  );
  const verseBlocks = section
    .split(/\|\|\s*BharSt_1\.\d+\s*\|\|/)
    .slice(0, -1);

  if (verseNumbers.length !== verseBlocks.length) {
    throw new Error(
      `Verse count mismatch: ${verseNumbers.length} numbers, ${verseBlocks.length} blocks.`
    );
  }

  const verses = verseBlocks.map((block, index) => {
    const number = verseNumbers[index];
    const lines = cleanLines(block);

    return {
      number,
      gretilId: `BharSt_1.${number}`,
      opening: lines[0],
      lines,
      sourceUrl: SOURCE_URL
    };
  });

  if (verses.length !== 109) {
    throw new Error(`Expected 109 Nīti verses from GRETIL, found ${verses.length}.`);
  }

  return verses;
}

function serialize(verses) {
  return JSON.stringify(
    {
      meta: {
        work: "Nīti Śataka",
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
const verses = parseNiti(html);

await mkdir(new URL("../data/works/niti/", import.meta.url), { recursive: true });
await writeFile(OUTPUT_PATH, serialize(verses), "utf8");
console.log(`Wrote ${verses.length} verses to ${OUTPUT_PATH.pathname}`);
