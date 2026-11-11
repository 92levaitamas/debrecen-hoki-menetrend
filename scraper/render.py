"""A kigyűjtött meccsekből HTML-táblázat, iCalendar-feed és JSON."""
import html
import json
from dataclasses import asdict
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from collect import TOURNAMENT, Game

BUDAPEST = ZoneInfo("Europe/Budapest")
GAME_LENGTH = timedelta(hours=2, minutes=30)
WEEKDAYS = ["hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat", "vasárnap"]


def admission(game: Game) -> str:
    if "Erste Liga" in game.competition:
        return "fizetős"
    if "Andersen Liga" in game.competition:
        return "nem tudni"
    return "valószínűleg ingyenes"


def to_json(games: list[Game]) -> str:
    return json.dumps([asdict(g) | {"admission": admission(g)} for g in games], ensure_ascii=False, indent=2, default=str)


def to_ics(games: list[Game], now: datetime) -> str:
    stamp = now.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    lines = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//debrecen-hoki-menetrend//HU",
        "CALSCALE:GREGORIAN", "X-WR-CALNAME:Jégkorong Debrecenben", "X-WR-TIMEZONE:Europe/Budapest",
    ]
    for g in games:
        lines += ["BEGIN:VEVENT", f"UID:{g.code.replace(' ', '-')}-{g.day.year}@debrecen-hoki-menetrend", f"DTSTAMP:{stamp}"]
        if g.start:
            start = g.start.replace(tzinfo=BUDAPEST).astimezone(timezone.utc)
            lines += [f"DTSTART:{start:%Y%m%dT%H%M%SZ}", f"DTEND:{start + GAME_LENGTH:%Y%m%dT%H%M%SZ}"]
        else:
            lines += [f"DTSTART;VALUE=DATE:{g.day:%Y%m%d}", f"DTEND;VALUE=DATE:{g.day + timedelta(days=1):%Y%m%d}"]
        description = f"{g.competition}\nBelépő: {admission(g)}" + ("" if g.start else "\nKezdési idő még nincs.")
        lines += [
            f"SUMMARY:{_ics_escape(_title(g))}", f"LOCATION:{_ics_escape(g.venue)}",
            f"DESCRIPTION:{_ics_escape(description)}", "END:VEVENT",
        ]
    lines.append("END:VCALENDAR")
    return "\r\n".join(_fold(line) for line in lines) + "\r\n"


def to_html(games: list[Game], now: datetime) -> str:
    rows = "\n".join(
        "<tr>"
        f"<td>{g.day:%Y.%m.%d.} {WEEKDAYS[g.day.weekday()]}</td>"
        f"<td>{g.start.strftime('%H:%M') if g.start else '<em>nincs még</em>'}</td>"
        f"<td{' class=\"paid\" title=\"fizetős\"' if admission(g) == 'fizetős' else ''}>{html.escape(g.competition)}</td>"
        f"<td>{html.escape(_title(g))}</td>"
        f"<td>{html.escape(g.venue)}</td>"
        "</tr>"
        for g in games
    )
    return f"""<!doctype html>
<html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Jégkorong Debrecenben</title>
<style>
:root {{ --bg:#fff; --fg:#1b1f24; --muted:#5b6470; --line:#d9dee4; --head:#f2f4f7; --paid:#b42318; }}
@media (prefers-color-scheme: dark) {{ :root {{ --bg:#14171b; --fg:#e6e9ed; --muted:#9aa3ad; --line:#2c323a; --head:#1d2228; --paid:#f97066; }} }}
body {{ margin:0; padding:16px; background:var(--bg); color:var(--fg); font:15px/1.45 system-ui, sans-serif; }}
h1 {{ font-size:1.4rem; margin:0 0 4px; }} p {{ color:var(--muted); margin:0 0 16px; }}
.wrap {{ overflow-x:auto; }} table {{ border-collapse:collapse; width:100%; min-width:720px; }}
th, td {{ text-align:left; padding:8px 10px; border-bottom:1px solid var(--line); vertical-align:top; }}
th {{ background:var(--head); position:sticky; top:0; }} .paid {{ color:var(--paid); font-weight:600; }}
a {{ color:inherit; }}
</style></head><body>
<h1>Jégkorong Debrecenben</h1>
<p>{len(games)} közelgő meccs a Debreceni Jégcsarnokban · frissítve: {now:%Y.%m.%d. %H:%M} ·
<a href="debrecen.ics">naptár-feliratkozás (.ics)</a> · forrás: jegkorongszovetseg.hu ·
<span class="paid">piros</span> = fizetős</p>
<div class="wrap"><table>
<thead><tr><th>Dátum</th><th>Idő</th><th>Bajnokság</th><th>Mérkőzés</th><th>Helyszín</th></tr></thead>
<tbody>
{rows}
</tbody></table></div>
</body></html>
"""


def _title(g: Game) -> str:
    return f"{g.home} (torna)" if g.away == TOURNAMENT else f"{g.home} – {g.away}"


def _ics_escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


def _fold(line: str) -> str:
    # RFC 5545: 75 oktettnél hosszabb sort folytatósorokra kell törni.
    out, current = [], b""
    for ch in line:
        encoded = ch.encode("utf-8")
        if len(current) + len(encoded) > 74:
            out.append(current.decode("utf-8"))
            current = b" "
        current += encoded
    out.append(current.decode("utf-8"))
    return "\r\n".join(out)
