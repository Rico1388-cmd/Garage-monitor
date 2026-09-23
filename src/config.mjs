import path from "node:path";

function boolean(value, fallback) {
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "ja", "on"].includes(String(value).toLowerCase());
}

function positiveInt(value, fallback, minimum = 1) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback;
}

export function loadConfig(env = process.env) {
  const modes = (env.NOTIFY_MODE || "stdout")
    .split(",")
    .map((mode) => mode.trim().toLowerCase())
    .filter(Boolean);

  const config = {
    offerUrl: env.OFFER_URL || "https://mijnwoonservice.mijndak.nl/Woningaanbod",
    targetCity: env.TARGET_CITY || "Heemstede",
    garageTerms: (env.GARAGE_TERMS || "garage,garagebox,garage-box,autobox,garage-unit")
      .split(",")
      .map((term) => term.trim())
      .filter(Boolean),
    pollIntervalSeconds: positiveInt(env.POLL_INTERVAL_SECONDS, 30, 15),
    notifyExistingOnFirstRun: boolean(env.NOTIFY_EXISTING_ON_FIRST_RUN, false),
    stateFile: path.resolve(env.STATE_FILE || "./data/state.json"),
    persistLastSuccessfulCheck: boolean(env.PERSIST_LAST_SUCCESSFUL_CHECK, true),
    browserChannel: (env.BROWSER_CHANNEL || "").trim(),
    headless: boolean(env.HEADLESS, true),
    logLevel: (env.LOG_LEVEL || "info").toLowerCase(),
    modes,
    ntfyServer: (env.NTFY_SERVER || "https://ntfy.sh").replace(/\/$/, ""),
    ntfyTopic: env.NTFY_TOPIC || "",
    telegramBotToken: env.TELEGRAM_BOT_TOKEN || "",
    telegramChatId: env.TELEGRAM_CHAT_ID || ""
  };

  const allowed = new Set(["stdout", "ntfy", "telegram"]);
  for (const mode of modes) {
    if (!allowed.has(mode)) throw new Error(`Onbekende NOTIFY_MODE: ${mode}`);
  }
  if (modes.includes("ntfy") && !config.ntfyTopic) {
    throw new Error("NTFY_TOPIC ontbreekt terwijl NOTIFY_MODE ntfy bevat.");
  }
  if (modes.includes("telegram") && (!config.telegramBotToken || !config.telegramChatId)) {
    throw new Error("TELEGRAM_BOT_TOKEN en TELEGRAM_CHAT_ID zijn vereist voor Telegram.");
  }
  if (!config.garageTerms.length) throw new Error("GARAGE_TERMS mag niet leeg zijn.");

  return config;
}
