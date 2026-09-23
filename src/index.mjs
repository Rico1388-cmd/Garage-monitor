import { loadConfig } from "./config.mjs";
import { filterTargetListings } from "./filter.mjs";
import { notify } from "./notifier.mjs";
import { loadState, saveState } from "./state.mjs";
import { createScraper } from "./scrape.mjs";

const once = process.argv.includes("--once");
const testNotification = process.argv.includes("--test-notification");
const config = loadConfig();
let stopping = false;
let scraper = null;

function timestamp() {
  return new Date().toISOString();
}

function log(message, extra = "") {
  console.log(`[${timestamp()}] ${message}${extra ? ` ${extra}` : ""}`);
}

async function checkOnce() {
  const state = await loadState(config.stateFile);
  if (!scraper) scraper = await createScraper(config);
  const allListings = await scraper.scrapeListings();
  const targets = filterTargetListings(allListings, config.targetCity, config.garageTerms);
  const now = timestamp();

  log(`Controle gereed: ${allListings.length} advertenties, ${targets.length} garage(s) in ${config.targetCity}.`);

  if (!state.initialized && !config.notifyExistingOnFirstRun) {
    for (const listing of targets) state.seen[listing.id] = now;
    state.initialized = true;
    if (config.persistLastSuccessfulCheck) state.lastSuccessfulCheck = now;
    await saveState(config.stateFile, state);
    log(`Nulmeting opgeslagen; ${targets.length} bestaande treffer(s) niet gemeld.`);
    return;
  }

  for (const listing of targets) {
    if (state.seen[listing.id]) continue;
    await notify(config, listing);
    state.seen[listing.id] = now;
    await saveState(config.stateFile, state);
    log(`Nieuwe garage gemeld: publicatie ${listing.id}.`);
  }

  state.initialized = true;
  if (config.persistLastSuccessfulCheck) state.lastSuccessfulCheck = now;
  await saveState(config.stateFile, state);
}

async function run() {
  if (testNotification) {
    await notify(config, {
      id: "test",
      url: config.offerUrl,
      text: "TESTMELDING\nGaragebox\nHeemstede\n€ 125,00 per maand"
    });
    log("Testmelding verzonden.");
    return;
  }

  try {
    do {
      try {
        await checkOnce();
      } catch (error) {
        console.error(`[${timestamp()}] Controle mislukt:`, error?.stack || error);
        if (scraper) await scraper.close().catch(() => {});
        scraper = null;
        if (once) process.exitCode = 1;
      }
      if (once || stopping) break;

      const jitterMs = Math.floor(Math.random() * 5_000);
      await new Promise((resolve) => setTimeout(resolve, config.pollIntervalSeconds * 1_000 + jitterMs));
    } while (!stopping);
  } finally {
    if (scraper) await scraper.close().catch(() => {});
    scraper = null;
  }
}

process.on("SIGTERM", () => { stopping = true; });
process.on("SIGINT", () => { stopping = true; });

await run();
