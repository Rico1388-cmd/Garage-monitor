import test from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "../src/config.mjs";

test("leest instellingen voor de gratis GitHub-route", () => {
  const config = loadConfig({
    NOTIFY_MODE: "ntfy",
    NTFY_TOPIC: "een-lange-geheime-topicnaam",
    STATE_FILE: "./data/state.json",
    PERSIST_LAST_SUCCESSFUL_CHECK: "false",
    BROWSER_CHANNEL: "chrome"
  });

  assert.equal(config.persistLastSuccessfulCheck, false);
  assert.equal(config.browserChannel, "chrome");
  assert.deepEqual(config.modes, ["ntfy"]);
});
