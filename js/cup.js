// Tornás menetrend-oldal (/u10/menetrend, /u8/menetrend): az összes fül (MINI A/B/C …).
// Itt nincs vendégcsapat, csak rendező; a résztvevők a sorsolásban vannak.
async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < 80 && !document.querySelector('mjsz-vbr-schedule-cup')?.shadowRoot?.querySelector('tbody tr'); i++) await sleep(250);
  const el = document.querySelector('mjsz-vbr-schedule-cup');
  const root = el.shadowRoot || el;

  const games = [];
  const tabNames = [...root.querySelectorAll('button')].map(b => b.innerText.trim()).filter(t => /MINI/i.test(t));
  for (const tab of tabNames) {
    [...root.querySelectorAll('button')].find(b => b.innerText.trim() === tab).click();
    await sleep(3000);
    for (const tr of root.querySelectorAll('tbody tr')) {
      // oszlopok: 0 kód, 1 dátum, 2 idő, 3 szakasz, 4 rendező, 5 helyszín
      const c = [...tr.querySelectorAll('td')].map(td => td.textContent.trim().replace(/\s+/g, ' '));
      if (/Debrecen/i.test(c[5] || '')) {
        games.push({ code: c[0], competition: `${tab} – ${c[3]}`, date: c[1], time: c[2], home: c[4], away: 'Torna', venue: c[5] });
      }
    }
  }
  return games;
}
