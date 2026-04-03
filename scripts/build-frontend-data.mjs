import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const WORKS = [
  {
    key: "niti",
    sourceLibrary: resolve(ROOT, "data", "works", "niti", "library.json"),
    sourceRenderings: resolve(ROOT, "data", "works", "niti", "renderings.json"),
    outputLibrary: resolve(ROOT, "niti-library.js"),
    outputRenderings: resolve(ROOT, "niti-renderings.js"),
    windowMeta: "nitiLibraryMeta",
    windowLibrary: "nitiLibrary",
    windowRenderings: "nitiEditorialRenderings"
  },
  {
    key: "vairagya",
    sourceLibrary: resolve(ROOT, "data", "works", "vairagya", "library.json"),
    sourceRenderings: resolve(ROOT, "data", "works", "vairagya", "renderings.json"),
    outputLibrary: resolve(ROOT, "vairagya-library.js"),
    outputRenderings: resolve(ROOT, "vairagya-renderings.js"),
    windowMeta: "vairagyaLibraryMeta",
    windowLibrary: "vairagyaLibrary",
    windowRenderings: "vairagyaEditorialRenderings"
  },
  {
    key: "sringara",
    sourceLibrary: resolve(ROOT, "data", "works", "sringara", "library.json"),
    sourceRenderings: resolve(ROOT, "data", "works", "sringara", "renderings.json"),
    outputLibrary: resolve(ROOT, "sringara-library.js"),
    outputRenderings: resolve(ROOT, "sringara-renderings.js"),
    windowMeta: "sringaraLibraryMeta",
    windowLibrary: "sringaraLibrary",
    windowRenderings: "sringaraEditorialRenderings"
  },
  {
    key: "vakya",
    sourceLibrary: resolve(ROOT, "data", "works", "vakya", "library.json"),
    sourceRenderings: resolve(ROOT, "data", "works", "vakya", "renderings.json"),
    outputLibrary: resolve(ROOT, "vakya-library.js"),
    outputRenderings: resolve(ROOT, "vakya-renderings.js"),
    windowMeta: "vakyaLibraryMeta",
    windowLibrary: "vakyaLibrary",
    windowRenderings: "vakyaEditorialRenderings"
  }
];

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function serializeLibrary({ meta, verses }, metaName, libraryName) {
  return `window.${metaName} = ${JSON.stringify(meta, null, 2)};\n\nwindow.${libraryName} = ${JSON.stringify(
    verses,
    null,
    2
  )};\n`;
}

function serializeRenderings(renderings, renderingsName) {
  return `window.${renderingsName} = ${JSON.stringify(renderings, null, 2)};\n`;
}

for (const work of WORKS) {
  const library = await readJson(work.sourceLibrary);
  const renderings = await readJson(work.sourceRenderings);

  await mkdir(dirname(work.outputLibrary), { recursive: true });
  await writeFile(
    work.outputLibrary,
    serializeLibrary(library, work.windowMeta, work.windowLibrary),
    "utf8"
  );
  await writeFile(
    work.outputRenderings,
    serializeRenderings(renderings, work.windowRenderings),
    "utf8"
  );

  console.log(
    `Generated ${work.key}: ${library.meta.verseCount} verses, ${Object.keys(renderings).length} renderings`
  );
}
