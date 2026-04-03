import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const NODE = process.execPath;

for (const script of [
  "build-niti-library.mjs",
  "build-sringara-library.mjs",
  "build-vairagya-library.mjs",
  "build-vakya-library.mjs",
  "build-frontend-data.mjs"
]) {
  const scriptPath = resolve(SCRIPTS_DIR, script);
  const { stdout, stderr } = await execFileAsync(NODE, [scriptPath], {
    cwd: resolve(SCRIPTS_DIR, "..")
  });

  if (stdout.trim()) {
    process.stdout.write(stdout);
  }

  if (stderr.trim()) {
    process.stderr.write(stderr);
  }
}
