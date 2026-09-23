import { chromium } from "playwright";

const DETAIL_SELECTOR = 'main a[href*="HuisDetails?PublicatieId="]';

async function dismissOverlays(page) {
  const rejectCookies = page.getByRole("button", { name: "Alles afwijzen" });
  if (await rejectCookies.isVisible().catch(() => false)) {
    await rejectCookies.click({ timeout: 5_000 }).catch(() => {});
  }

  // Mijn Woonservice toont soms een algemene mededeling als modal. Sluit die
  // alleen wanneer er werkelijk een zichtbare sluitlink in de dialoog staat.
  const closeNotice = page.locator('[role="dialog"] a[href="#"]:visible').last();
  if (await closeNotice.isVisible().catch(() => false)) {
    await closeNotice.click({ timeout: 5_000 }).catch(() => {});
  }
}

export async function createScraper(config) {
  const launchOptions = {
    headless: config.headless,
    args: ["--disable-dev-shm-usage"]
  };
  if (config.browserChannel) launchOptions.channel = config.browserChannel;

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({
    locale: "nl-NL",
    userAgent: "Mozilla/5.0 (compatible; MijnWoonservice-Heemstede-Monitor/1.0)"
  });
  const page = await context.newPage();

  return {
    async scrapeListings() {
    await page.goto(config.offerUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await dismissOverlays(page);

    await page.waitForFunction(() => {
      const text = document.body?.innerText || "";
      return document.querySelector('a[href*="HuisDetails?PublicatieId="]')
        || text.includes("Geen passend aanbod gevonden")
        || text.includes("Geen resultaten gevonden");
    }, { timeout: 30_000 });

    // De lege-melding kan heel even zichtbaar zijn vóór de OutSystems-dataactie
    // klaar is. Geef de uiteindelijke lijst daarom een vaste renderbuffer.
    await page.waitForTimeout(5_000);

    const rawListings = await page.locator(DETAIL_SELECTOR).evaluateAll((anchors) => anchors.map((anchor) => ({
      href: anchor.getAttribute("href") || "",
      text: anchor.innerText || anchor.textContent || ""
    })));

    const listings = [];
    for (const raw of rawListings) {
      const url = new URL(raw.href, config.offerUrl);
      const id = url.searchParams.get("PublicatieId");
      if (id) listings.push({ id, url: url.href, text: raw.text.trim() });
    }

      return listings;
    },
    async close() {
      await browser.close();
    }
  };
}
