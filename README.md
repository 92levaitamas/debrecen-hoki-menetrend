# Debreceni jégkorongmeccsek — menetrend-gyűjtő

Cél: minden meccs, aminek a **helyszíne Debrecen** (Debreceni Jégcsarnok: `Debrecen, Centerpálya`,
`Debrecen, 2. pálya`), bármelyik bajnokságból, csak a közelgők. Hetente frissülő, bárhonnan elérhető
lista, lehetőleg naptár-feliratkozással (`.ics`).

## Adatforrás

A jegkorongszovetseg.hu oldalai Vue web componentekkel (`<mjsz-vbr-*>`, shadow DOM) töltik az adatot az
`https://api.icehockey.hu/vbr` API-ból. A hívás `X-API-KEY` headert kér.

| Endpoint | Paraméterek | Mire jó |
|---|---|---|
| `/v2/championship-seasons` | `championshipName` (pl. `U-14 Bajnokság`) | szezonok és bajnokság-id |
| `/v2/championship-phases` | `championshipId` | szakaszok (Alapszakasz-A1, Osztályozó, Középszakasz …) |
| `/v2/games-list` | `championshipId`, `division`, `phaseId` | egy szakasz teljes menetrendje |
| `/v2/public-calendar` | `seasonId` (2026-27: `251`) | összesített naptár, minden bajnokság, kb. 3 hét előre |
| `/v2/calendar` | — | tornás bajnokságok (U8, U10) |

A widget-csomagok: `@mjsz-vbr-elements/core`, `elements`, `extended`, `liga`, `gamecenter` (unpkg).
A válasz-JSON szerkezetét még nem néztük meg.

## Oldalak (2026-27)

- Bajnokság-widget (`mjsz-vbr-championship`): `/u21/bajnoksag`, `/u19/bajnoksag`, `/u16/bajnoksag`,
  `/u14/bajnoksag`, `/u12/bajnoksag`, `/u18/3x3/bajnoksag`, `/u16/3x3-bajnoksag`, `/u14/3x3-bajnoksag`,
  `/u12/3x3-bajnoksag`, `/ob-i-bajnoksag`, `/noi/u25` stb. A divízió fülek (`button[role=tab]`) és a
  `#season` / `#phases` select a shadow DOM-ban vannak.
- Torna-widget (`mjsz-vbr-schedule-cup`): `/u10/menetrend` (MINI A/B/C), `/u8/menetrend` (SZUPERMINI A/B/C).
  Itt nincs vendégcsapat, csak „Rendező”; a résztvevők a sorsolás-PDF-ben vannak.
- Összesített naptár (`mjsz-vbr-calendar`): `/versenynaptar` → „KÖVETKEZŐ MÉRKŐZÉSEK” + „Még több”.

## Ami működik most

`browser/` — DevTools Console-ban futtatható scriptek, böngészőből:

- `championship-scraper.js` — egy bajnoksági oldal összes divíziója × szakasza, teljes szezon.
- `calendar-scraper.js` — az összesített naptár, minden bajnokság, de csak kb. 3 hétre előre.

A kettő együtt adja a teljes képet: a naptár minden bajnokságot lát, a bajnoksági oldal a teljes szezont.

## Belépő

- **Erste Liga (DEAC):** fizetős — 2025/26: felnőtt 2 500 Ft, diák/nyugdíjas 2 000 Ft, playoff 3 500 / 2 500 Ft
  ([deac.hu/klub/jegyarak](https://deac.hu/klub/jegyarak/)).
- **Utánpótlás, tornák, női U25, OB IV:** valószínűleg ingyenes, írásos forrás nincs.
- **Andersen Liga (DEAC JA):** nem tudni.
- Kérdés: Debreceni Hoki Klub, `info@debrecenihoki.hu`, +36 70 374 1647.

## Terv: heti frissítés

```
GitHub Actions (cron, hetente)
  → Python-script: api.icehockey.hu/vbr/v2 — minden bajnokság menetrendje, szűrés helyszín = Debrecen
  → GitHub Pages: debrecen.html + debrecen.ics (naptár-feliratkozás, UID = meccs-id)
```

## Nyitott kérdések

- **API-kulcs:** az oldalba ágyazott widget-kulcs (nincs rá felhasználási engedély, bármikor cserélhetik),
  vagy saját kulcs az MJSZ-től. A kulcs repo-secretként megy, nem a kódba.
- **Belépő:** utánpótlás / Andersen Liga / OB IV — lásd fent.
