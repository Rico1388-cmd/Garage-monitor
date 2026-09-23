# Mijn Woonservice – garagemonitor Heemstede

Deze monitor controleert het openbare aanbod op **Mijn Woonservice / DAK** en
meldt uitsluitend advertenties die tegelijk:

- de plaats **Heemstede** bevatten; en
- expliciet een **garage, garagebox, garage-box, autobox of garage-unit** noemen.

Een parkeerplaats, carport, berging of gewone woning wordt dus niet gemeld.
De monitor reageert nergens automatisch op; hij signaleert alleen en stuurt de
directe advertentielink mee.

## Gratis online: iedere vijf minuten (aanbevolen)

Deze variant draait via GitHub Actions. Je laptop mag volledig uitstaan. De
programmacode staat in een openbaar GitHub-project, maar de geheime naam van je
meldkanaal wordt als afgeschermd secret opgeslagen en komt niet in de code.

1. Maak gratis een account op `github.com`.
2. Kies **New repository**, geef het een naam zoals `garage-monitor` en zet de
   zichtbaarheid op **Public**. Alleen openbare projecten hebben onbeperkte
   gratis standaard Actions-minuten.
3. Pak dit zipbestand uit en upload alle bestanden en mappen naar het project.
   Controleer dat ook `.github/workflows/monitor.yml` aanwezig is.
4. Installeer de ntfy-app op je telefoon en bedenk een lange, willekeurige
   topicnaam van minimaal 24 tekens. Abonneer je in de app op:
   `https://ntfy.sh/JOUW-LANGE-TOPICNAAM`.
5. Open in GitHub **Settings → Secrets and variables → Actions → New repository
   secret**. Gebruik als naam `NTFY_TOPIC` en als waarde alleen jouw lange
   topicnaam.
6. Open **Actions → Controleer garages in Heemstede → Run workflow** voor de
   eerste test. Daarna draait de controle automatisch iedere vijf minuten.

De eerste uitvoering is bewust een nulmeting: bestaand aanbod wordt opgeslagen
maar niet ten onrechte als nieuw gemeld. Iedere maand wordt een klein
heartbeat-bestand bijgewerkt, zodat GitHub de geplande taak niet wegens een
lange periode zonder projectactiviteit uitschakelt.

GitHub waarschuwt dat geplande taken tijdens drukte soms later kunnen starten of
incidenteel kunnen uitvallen. Vijf minuten is dus het doelinterval, geen harde
garantie. Voor dit gebruik is dat meestal ruim voldoende.

## Alternatief: continu draaien met Docker

Vereist: Docker Desktop, een NAS met Docker/Container Manager, een Raspberry Pi
met Docker, of een kleine VPS.

1. Pak deze map uit en open een terminal in de map.
2. Kopieer `.env.example` naar `.env`.
3. Kies hieronder `ntfy` of `Telegram` en vul de betreffende regels in.
4. Test eerst de melding:

   ```bash
   docker compose run --rm garage-monitor node src/index.mjs --test-notification
   ```

5. Doe één echte controle:

   ```bash
   docker compose run --rm garage-monitor node src/index.mjs --once
   ```

6. Start de 24/7-monitor:

   ```bash
   docker compose up -d --build
   ```

Logs bekijken:

```bash
docker compose logs -f garage-monitor
```

Stoppen:

```bash
docker compose down
```

De Docker-volume `garage-state` bewaart reeds geziene publicatie-ID's. Daardoor
wordt dezelfde garage niet nogmaals gemeld na een herstart.

## Optie A: ntfy (snelste installatie)

1. Installeer de ntfy-app op je telefoon.
2. Bedenk een lange, willekeurige topicnaam, bijvoorbeeld met minimaal 24
   willekeurige tekens. Een topic op de openbare ntfy-server is in feite een
   geheim kanaal: iedereen die de naam raadt kan het lezen.
3. Abonneer je in de app op `https://ntfy.sh/JOUW-LANGE-TOPICNAAM`.
4. Zet in `.env`:

   ```dotenv
   NOTIFY_MODE=ntfy
   NTFY_SERVER=https://ntfy.sh
   NTFY_TOPIC=JOUW-LANGE-TOPICNAAM
   ```

## Optie B: Telegram

1. Maak via de officiële `@BotFather` een bot en bewaar de token.
2. Stuur zelf één bericht aan je nieuwe bot.
3. Zoek je numerieke chat-ID op via de Bot API of een vertrouwde chat-ID-bot.
4. Zet in `.env`:

   ```dotenv
   NOTIFY_MODE=telegram
   TELEGRAM_BOT_TOKEN=123456:vervang_dit
   TELEGRAM_CHAT_ID=123456789
   ```

Gebruik `NOTIFY_MODE=ntfy,telegram` om beide kanalen te gebruiken. Gebruik
`NOTIFY_MODE=stdout` om alleen naar de logs te schrijven.

## Belangrijke instellingen

- `POLL_INTERVAL_SECONDS=30`: controle om de 30–35 seconden (kleine willekeurige
  spreiding inbegrepen). Waarden onder 15 seconden worden bewust niet gebruikt.
- `NOTIFY_EXISTING_ON_FIRST_RUN=false`: de eerste start is een nulmeting. Zet dit
  vóór de allereerste start op `true` als bestaand aanbod ook direct gemeld moet
  worden.
- `GARAGE_TERMS=...`: pas alleen aan als Mijn Woonservice later een andere
  benaming voor garageboxen gebruikt.
- `HEADLESS=true`: laat de browser onzichtbaar draaien.

## Zonder Docker

Vereist: Node.js 20 of nieuwer.

```bash
npm install
npx playwright install --with-deps chromium
cp .env.example .env
```

Exporteer vervolgens de waarden uit `.env` via je systeem of gebruik een
procesmanager die een env-bestand ondersteunt. Zet bij lokaal gebruik
`STATE_FILE=./data/state.json` en start met `npm start`.

## Werking en veiligheid

- De bron is de openbare pagina
  `https://mijnwoonservice.mijndak.nl/Woningaanbod`; inloggen is niet nodig.
- Elke kaart met een link `HuisDetails?PublicatieId=...` wordt gelezen.
- Alleen de combinatie **Heemstede + expliciet garagewoord** passeert het filter.
- Een melding wordt pas als afgehandeld opgeslagen nadat het meldkanaal succes
  heeft teruggegeven. Bij een tijdelijke fout probeert de volgende ronde het
  opnieuw.
- Er worden geen Mijn Woonservice-inloggegevens opgeslagen en de monitor doet
  geen automatische reactie of inschrijving.

Websites kunnen hun HTML wijzigen. Controleer daarom af en toe de logs; bij een
structurele wijziging zal de controle foutmelden of nul advertenties zien.
