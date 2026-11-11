"""Belépési pont: kigyűjti a közelgő debreceni meccseket, és a docs/ mappába írja a kimenetet."""
from datetime import datetime
from pathlib import Path

from collect import collect_games
from render import BUDAPEST, to_html, to_ics, to_json

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "docs"


def main() -> None:
    now = datetime.now(BUDAPEST)
    games = [g for g in collect_games() if g.day >= now.date()]
    if not games:
        raise SystemExit("Egyetlen debreceni meccs sem jött vissza — valószínűleg megváltozott az oldal szerkezete.")

    OUTPUT_DIR.mkdir(exist_ok=True)
    (OUTPUT_DIR / "index.html").write_text(to_html(games, now), encoding="utf-8")
    (OUTPUT_DIR / "debrecen.ics").write_text(to_ics(games, now), encoding="utf-8", newline="")
    (OUTPUT_DIR / "games.json").write_text(to_json(games), encoding="utf-8")
    print(f"{len(games)} közelgő meccs kiírva: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
