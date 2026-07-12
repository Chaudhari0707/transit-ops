/**
 * Fails when tracked source files exceed the configured line limit.
 * Existing oversized files are listed in file-size-allowlist.txt until split.
 */
import { Glob } from "bun";

const ROOT = import.meta.dir.replace(/\/scripts$/, "");
const ALLOWLIST_PATH = `${import.meta.dir}/file-size-allowlist.txt`;
const MAX_LINES = 500;

async function loadAllowlist(): Promise<Set<string>> {
  const allowlistFile = Bun.file(ALLOWLIST_PATH);

  if (!(await allowlistFile.exists())) {
    return new Set();
  }

  const raw = await allowlistFile.text();
  return new Set(
    raw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#")),
  );
}

async function main() {
  const allowlist = await loadAllowlist();
  const glob = new Glob("src/**/*.{ts,tsx}");
  const violations: Array<{ lines: number; path: string }> = [];

  for await (const relativePath of glob.scan({ cwd: ROOT, onlyFiles: true })) {
    const normalizedPath = relativePath.replaceAll("\\", "/");

    if (allowlist.has(normalizedPath)) {
      continue;
    }

    const contents = await Bun.file(`${ROOT}/${normalizedPath}`).text();
    const lineCount = contents.split("\n").length;

    if (lineCount > MAX_LINES) {
      violations.push({ lines: lineCount, path: normalizedPath });
    }
  }

  if (violations.length === 0) {
    console.log(`file-size: all tracked src files are <= ${MAX_LINES} lines (allowlist applied).`);
    return;
  }

  violations.sort((left, right) => right.lines - left.lines);

  console.error(`file-size: ${violations.length} file(s) exceed ${MAX_LINES} lines:\n`);
  for (const violation of violations) {
    console.error(`  ${violation.lines.toString().padStart(5)}  ${violation.path}`);
  }

  // @ts-expect-error - Bun.exit is not typed in NextJS global Bun types
  Bun.exit(1);
}

await main();
