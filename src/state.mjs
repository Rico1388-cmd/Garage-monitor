import fs from "node:fs/promises";
import path from "node:path";

export function emptyState() {
  return { version: 1, initialized: false, seen: {}, lastSuccessfulCheck: null };
}

export async function loadState(filename) {
  try {
    const parsed = JSON.parse(await fs.readFile(filename, "utf8"));
    return {
      ...emptyState(),
      ...parsed,
      seen: parsed.seen && typeof parsed.seen === "object" ? parsed.seen : {}
    };
  } catch (error) {
    if (error.code === "ENOENT") return emptyState();
    throw new Error(`Statusbestand is niet leesbaar: ${error.message}`);
  }
}

export async function saveState(filename, state) {
  await fs.mkdir(path.dirname(filename), { recursive: true });
  const temporary = `${filename}.${process.pid}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  await fs.rename(temporary, filename);
}
