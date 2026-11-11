"""Debreceni helyszínű meccsek kigyűjtése a jegkorongszovetseg.hu nyilvános oldalairól, headless böngészővel."""
import re
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

BASE_URL = "https://www.jegkorongszovetseg.hu"
JS_DIR = Path(__file__).resolve().parent.parent / "js"

# A naptár minden bajnokságot ad, de csak kb. 3 hétre előre; az utánpótlás-oldalak a teljes szezont.
CALENDAR_PAGE = "/versenynaptar"
CHAMPIONSHIP_PAGES = ["/u21/bajnoksag", "/u19/bajnoksag", "/u16/bajnoksag", "/u14/bajnoksag", "/u12/bajnoksag"]
CUP_PAGES = ["/u10/menetrend", "/u8/menetrend"]
TOURNAMENT = "Torna"  # tornánál a vendégcsapat helyén ez áll


@dataclass(frozen=True)
class Game:
    code: str
    competition: str
    day: date
    start: datetime | None  # None, ha a kezdési időt még nem rögzítették (az oldal 00:00-t mutat)
    home: str
    away: str
    venue: str


def collect_games() -> list[Game]:
    jobs = [(CALENDAR_PAGE, "calendar.js")]
    jobs += [(path, "championship.js") for path in CHAMPIONSHIP_PAGES]
    jobs += [(path, "cup.js") for path in CUP_PAGES]

    raw: list[dict] = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for path, script in jobs:
            # Oldalanként új lap: egy lapon egymás után navigálva a widget néha üres állapotban ragadt.
            page = browser.new_page(locale="hu-HU", timezone_id="Europe/Budapest")
            page.on("console", lambda msg: print("  ", msg.text) if msg.text.endswith(" sor") else None)
            raw += _run(page, path, script)
            page.close()
        browser.close()

    games: dict[str, Game] = {}
    for item in raw:
        game = _to_game(item)
        games.setdefault(game.code, game)  # a naptár sora előbb jön, annak teljesebb a bajnokság-neve
    return sorted(games.values(), key=lambda g: (g.day, g.start or datetime.min, g.code))


def _run(page: Page, path: str, script: str) -> list[dict]:
    page.goto(BASE_URL + path, wait_until="domcontentloaded", timeout=60_000)
    result = page.evaluate((JS_DIR / script).read_text(encoding="utf-8"))
    print(f"{path}: {len(result)} debreceni sor")
    return result


def _to_game(item: dict) -> Game:
    day = datetime.strptime(re.match(r"\d{4}\.\d{2}\.\d{2}", item["date"]).group(0), "%Y.%m.%d").date()
    hour, minute = (int(x) for x in item["time"].split(":"))
    start = None if (hour, minute) == (0, 0) else datetime(day.year, day.month, day.day, hour, minute)
    return Game(
        code=item["code"].strip(),
        competition=item["competition"].strip(),
        day=day,
        start=start,
        home=item["home"].strip(),
        away=item["away"].strip() or TOURNAMENT,  # a naptár tornánál néha üresen hagyja a vendéget
        venue=item["venue"].strip(),
    )
