# Stuck of Amascut

Full-stack Express + MySQL (Sequelize) + vanilla JS/Bootstrap 5 clan-hub for
en 5-manns OSRS-gjeng (Xenopixie, Deviousrunt, Cryqt, Guniit, Lilljiy).

## Funksjoner
- **JWT-login/registrering.** Man kan bare registrere seg som en av de 5
  forhåndsdefinerte karakterene, og bare hvis den ikke allerede er tatt.
  Når en karakter er klaimet av en bruker kan ingen andre skrive over den
  (håndheves både i service-laget og med en `UNIQUE`-constraint i databasen).
- **Hjem-fane** - Facebook-aktig feed hvor alle innloggede kan poste innlegg,
  bilder (URL) og "flex" om loot. Kan også auto-poste loot direkte fra
  RuneLite sin webhook-funksjon (se eget avsnitt under).
- **5 karakter-faner**, hver med:
  - **3 gear-underfaner: ⚔️ Melee / 🏹 Range / 🔮 Magic** - helt uavhengige
    utstyrsoppsett per stil (som å bytte "setup" i Wiki sin DPS-calculator).
    Kun eieren av karakteren kan endre, alle kan se.
  - **Stats** hentet direkte fra det offentlige OSRS Hiscores-APIet.
  - **Boss kill count.**
- **Events-fane** - legg til events manuelt med tittel/beskrivelse/tidspunkt,
  med live nedtelling.
- **Loot Simulator-fane** - droprate-simulator + "flaks-sjekker" (ekte
  binomisk sannsynlighet) for DT2-bosser, Wilderness-bossene som faktisk
  dropper Voidwaker (Callisto/Artio, Venenatis/Spindel, Vet'ion/Calvar'ion),
  CoX/ToA, Zulrah/Vorkath/Cerberus m.fl.

## Mappestruktur

```
config/       - database.js (Sequelize-oppkobling) + gear-katalog
models/       - Sequelize-modeller: User, Character, GearSlot, Post, Event
                (+ index.js som setter opp alle relasjonene mellom dem)
seed/         - seed.js: oppretter de 5 faste karakterene + en velkomstpost
middleware/   - JWT-auth, eierskaps-sjekk, feilhåndtering
services/     - all forretningslogikk (auth, characters, gear, posts, events, hiscores)
controllers/  - tynne HTTP-handlers som kaller services
routes/       - Express-routere, én fil per ressurs
data/         - gearItems.json (item-katalog for gear-picker, med melee/range/magic-tagging)
public/       - statisk Bootstrap-frontend (login/home/characters/events/loot-simulator)
public/uploads/loot/ - screenshots fra RuneLite-webhooken havner her automatisk
```

## 1. Sett opp MySQL lokalt og test alt

Du trenger en lokal MySQL-server som kjører (MySQL 8, eller MariaDB funker
også). Opprett bruker + database hvis du ikke allerede har gjort det:

```sql
CREATE DATABASE osrs CHARACTER SET utf8mb4;
CREATE USER 'Osrs'@'localhost' IDENTIFIED BY 'Ilolgtr1290!';
GRANT ALL PRIVILEGES ON osrs.* TO 'Osrs'@'localhost';
FLUSH PRIVILEGES;
```

`.env.local` er allerede fylt ut med akkurat disse verdiene, og
`server.js` laster automatisk `.env.local` hvis den finnes (ellers faller
den tilbake på `.env`) - så du trenger ikke gjøre noe mer der.

```bash
npm install
npm start          # eller: npm run dev (nodemon, restarter ved filendring)
```

Serveren kobler til MySQL, kjører `sequelize.sync({ alter: true })` (lager/
oppdaterer tabellene automatisk ut fra modellene i `models/`), seeder de 5
karakterene, og starter på http://localhost:4000.

> For en liten clan-app er `sync({ alter: true })` helt fint. Vokser dette
> seg større senere, bytt til ordentlige `sequelize-cli`-migrasjoner.

## 2. Deploy på Render

1. Opprett en MySQL-database (Render har ikke MySQL som eget produkt, så
   bruk f.eks. en ekstern/managed MySQL, eller en "Private Service" med
   MySQL i et Docker-image - poenget er bare at du ender opp med
   host/port/bruker/passord/dbnavn, akkurat som lokalt).
2. Opprett en "Web Service" på Render pekende på dette repoet.
   - Build command: `npm install`
   - Start command: `npm start`
3. Under Render sine **Environment**-innstillinger, sett de samme variablene
   som i `.env.example`: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`,
   `DB_PASSWORD`, `DB_SSL=true`, `JWT_SECRET`, `JWT_EXPIRES_IN`,
   `WEBHOOK_SECRET`, `NODE_ENV=production`. Render injiserer disse som ekte
   miljøvariabler - du trenger ikke laste opp noen `.env`-fil i det hele tatt.
4. Første deploy oppretter tabellene og seeder karakterene automatisk (samme
   `sequelize.sync()` + `runSeed()` som lokalt).

## API-endepunkter (kort oversikt)

- `POST /api/auth/register` `{ username, password, characterId }`
- `POST /api/auth/login` `{ username, password }` -> JWT
- `GET  /api/auth/available-characters`
- `GET  /api/characters` / `GET /api/characters/:id`
- `GET  /api/characters/:id/gear` -> `{ melee: {...}, range: {...}, magic: {...} }`
- `PUT  /api/characters/:id/gear/:style` *(kun eier, krever JWT — style er melee/range/magic)*
- `POST /api/characters/:id/stats/refresh` *(kun eier, krever JWT)* - henter
  live fra `https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws?player=RSN`
- `GET  /api/posts` / `POST /api/posts` *(krever JWT)* / `DELETE /api/posts/:id`
- `GET  /api/events` / `POST /api/events` *(krever JWT)* / `DELETE /api/events/:id`
- `POST /api/webhook/loot/:characterId/:secret` - se under.

## 3. Auto-post på loot med RuneLite sin webhook (ingen ekstra script nødvendig!)

RuneLite kan sende varsler (drops, kill count, valuable drops osv.) direkte
til en hvilken som helst URL i Discords webhook-format - vi trenger bare
peke den på vårt eget endepunkt i stedet for en ekte Discord-webhook:

1. Åpne RuneLite → skiftenøkkel-ikonet (Settings) → **Notifications**.
2. Finn feltet **Webhook** og lim inn:
   ```
   http://DIN-SERVER/api/webhook/loot/<characterId>/<WEBHOOK_SECRET>
   ```
   Eksempel for Cryqt lokalt: `http://localhost:4000/api/webhook/loot/cryqt/local-dev-webhook-secret`
   (bytt `<characterId>` til `xenopixie` / `deviousrunt` / `cryqt` / `guniit` / `lilljiy`,
   og `<WEBHOOK_SECRET>` til verdien du satte i `.env`/`.env.local`).
3. Skru på **"Send screenshot"** hvis du vil ha bildet av dropet med i posten.
4. Gå inn i plugin-innstillingene for f.eks. **Loot Tracker** (eller
   "Grand Exchange"/"Kill Count" osv.) og skru på varsling + sett en
   verdi-terskel (f.eks. "varsle ved drops over 100k gp").

Når dette er satt opp, poster serveren automatisk i hjem-feeden hver gang
varselet trigges - ingen mellomliggende script nødvendig, siden endepunktet
forstår Discord sitt webhook-multipart-format direkte (`payload_json` +
evt. screenshot-fil).

**Alternativ / manuelt:** funker helt fint uten webhook også - bare kryss av
"Post som min karakter" i hjem-fanen og skriv det selv.

**Egne scripts:** samme endepunkt godtar også en enkel, egen JSON-body om du
heller vil skrive et lite script selv (f.eks. som leser loot-loggen din):
```
POST /api/webhook/loot/cryqt/<secret>
Content-Type: application/json
{ "itemName": "Twisted bow", "value": 1650000000, "imageUrl": "https://..." }
```

> Merk: RuneLites eksakte meny-navn/plassering for webhook-feltet har flyttet
> litt mellom versjoner. Søk etter "webhook" i settings-søkefeltet om du ikke
> finner det med det samme.

## Om Hiscores-integrasjonen

`services/hiscoreService.js` bruker Jagex sitt offentlige, ikke-autentiserte
CSV-endepunkt for OSRS-hiscores. Rekkefølgen på boss-kolonnene i CSV-en er
ikke offisielt dokumentert av Jagex og endrer seg litt hver gang de legger
til nye bosser - `BOSS_ORDER`-arrayet i den filen kan derfor trenge en liten
justering etter fremtidige oppdateringer. Kommentarene i filen forklarer
hvordan du sjekker/fikser det selv på 5 minutter.

## Om gear-utvalget

`data/gearItems.json` inneholder et nyttig, men ikke 100% komplett utvalg av
BiS/populære items per slot, hver tagget med `"style": "melee"|"range"|"magic"|"all"`
som styrer hvilken nedtrekksliste som vises i hvilken gear-underfane. Legg
gjerne til flere items der selv - strukturen er enkel.

## Banner / logo

Bannerets "5 noobs" er laget med ren CSS + emoji som plassholder (se
`.noob-banner` / `.noob-guy` i `public/css/style.css`). Bytt gjerne ut med et
ordentlig screenshot av gjengen i full noob-gear - legg filen i `public/img/`
og pek `.noob-banner` på den i stedet.
