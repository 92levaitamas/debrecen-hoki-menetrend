# Debreceni jégkorongmeccsek — menetrend-gyűjtő

Minden közelgő meccs, aminek a **helyszíne Debrecen** (Debreceni Jégcsarnok: `Debrecen, Centerpálya`,
`Debrecen, 2. pálya`), bármelyik bajnokságból. Hetente frissül; a kimenet a `docs/` mappában:

- `docs/index.html` — táblázat (dátum, idő, bajnokság, mérkőzés, helyszín, belépő)
- `docs/debrecen.ics` — naptár-feliratkozás (Google / Apple / Outlook), UID = meccs-kód + év
- `docs/games.json` — ugyanez gépi formában

## Működés

```
GitHub Actions (.github/workflows/update.yml, hétfő 05:00 UTC + kézi indítás)
  → scraper/main.py
      → scraper/collect.py: headless Chromium (Playwright) megnyitja a nyilvános oldalakat,
        és lefuttatja rajtuk a js/ scripteket
      → szűrés: helyszín tartalmazza „Debrecen”, dátum ≥ ma
      → scraper/render.py: HTML + iCalendar + JSON
  → commit a docs/ mappába
```

| Forrás | Script | Mit ad |
|---|---|---|
| `/versenynaptar` | `js/calendar.js` | minden bajnokság (felnőtt, női, 3x3, utánpótlás), kb. 3 hétre előre |
| `/u21`, `/u19`, `/u16`, `/u14`, `/u12` `/bajnoksag` | `js/championship.js` | a teljes szezon, minden divízió és szakasz |
| `/u10/menetrend`, `/u8/menetrend` | `js/cup.js` | tornák (csak rendező, a résztvevők a sorsolásban vannak) |

Ugyanaz a meccs-kód több forrásból is jöhet; a naptár sora nyer.

## Futtatás helyben

```
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m playwright install chromium
.venv\Scripts\python scraper\main.py
```

A `js/` scriptek Chrome DevTools Console-ban is futnak: bemásolás után `()`-val kell meghívni őket.

## Az oldal szerkezete

A jegkorongszovetseg.hu Vue web componentekkel (`<mjsz-vbr-*>`, shadow DOM) tölti az adatot az
`https://api.icehockey.hu/vbr` API-ból. Az oldalba ágyazott API-kulcs domainhez kötött (más helyről
403 `No permission is specified for the domain or ip address used`), ezért scriptből közvetlenül nem
használható — ezért fut headless böngésző.

| Endpoint | Paraméterek |
|---|---|
| `/v2/championship-seasons` | `championshipName` |
| `/v2/championship-sections`, `/v2/championship-phases` | `championshipId` |
| `/v2/games-list` | `championshipId`, `division`, `phaseId` |
| `/v2/public-calendar` | `seasonId` (2026-27: `251`) |

Ha saját API-kulcs lesz az MJSZ-től, a `scraper/collect.py` cserélhető, a kimenet marad.

## Belépő (szabály a `render.admission`-ben)

- **Erste Liga (DEAC):** fizetős — 2025/26: felnőtt 2 500 Ft, diák/nyugdíjas 2 000 Ft, playoff 3 500 / 2 500 Ft
  ([deac.hu/klub/jegyarak](https://deac.hu/klub/jegyarak/)).
- **Andersen Liga (DEAC JA):** nem tudni.
- **Minden más (utánpótlás, tornák, női U25, OB IV):** valószínűleg ingyenes, írásos forrás nincs.

## Ismert korlátok

- A naptár „Következő mérkőzések” nézete a futás napjának meccseit nem tartalmazza.
- A felnőtt, női és 3x3-as bajnokságok csak kb. 3 hétre előre látszanak (a naptár ablaka).
- A 00:00-s kezdés = még nincs rögzítve; ezek egész napos eseményként mennek a naptárba.
