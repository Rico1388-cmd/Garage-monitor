import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { emptyState, loadState, saveState } from "../src/state.mjs";

test("maakt en leest het statusbestand atomair", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "garage-monitor-"));
  const filename = path.join(directory, "state.json");
  const state = emptyState();
  state.initialized = true;
  state.seen["123"] = "2026-09-22T10:00:00.000Z";

  await saveState(filename, state);
  assert.deepEqual(await loadState(filename), state);
});
