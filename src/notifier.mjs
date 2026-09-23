function compactListingText(text) {
  return String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((line, index, all) => all.indexOf(line) === index)
    .slice(0, 12)
    .join("\n")
    .slice(0, 1200);
}

export function formatNotification(listing) {
  const details = compactListingText(listing.text);
  return {
    title: "🚗 Nieuwe garage in Heemstede",
    body: `${details || "Nieuwe garage-advertentie gevonden."}\n\n${listing.url}`
  };
}

async function checkedFetch(url, options, service) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`${service} gaf HTTP ${response.status}: ${detail}`);
  }
  return response;
}

async function sendNtfy(config, notification, clickUrl) {
  const topic = encodeURIComponent(config.ntfyTopic);
  await checkedFetch(`${config.ntfyServer}/${topic}`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      Title: notification.title,
      Tags: "car,rotating_light",
      Click: clickUrl
    },
    body: notification.body
  }, "ntfy");
}

async function sendTelegram(config, notification, clickUrl) {
  const endpoint = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
  await checkedFetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: config.telegramChatId,
      text: `${notification.title}\n\n${notification.body}`,
      disable_web_page_preview: true,
      reply_markup: { inline_keyboard: [[{ text: "Bekijk advertentie", url: clickUrl }]] }
    })
  }, "Telegram");
}

export async function notify(config, listing) {
  const notification = formatNotification(listing);
  for (const mode of config.modes) {
    if (mode === "stdout") {
      console.log(`\n${notification.title}\n${notification.body}\n`);
    } else if (mode === "ntfy") {
      await sendNtfy(config, notification, listing.url);
    } else if (mode === "telegram") {
      await sendTelegram(config, notification, listing.url);
    }
  }
}
