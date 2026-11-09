// Futtatás: Chrome DevTools Console-ban egy bajnoksági oldalon,
// pl. https://www.jegkorongszovetseg.hu/u14/bajnoksag
// Végigjárja az összes divízió-fület (U-14 A/B/C) és az összes szakaszt,
// és kiírja a debreceni helyszínű meccseket. Az aktuális szezon az alapértelmezett.
(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < 60 && !document.querySelector('mjsz-vbr-championship')?.shadowRoot?.querySelector('table'); i++) await sleep(250);
  const el = document.querySelector('mjsz-vbr-championship');
  const root = el.shadowRoot || el;

  const signature = () => {
    const t = root.querySelector('table');
    return t ? t.querySelectorAll('tbody tr').length + '|' + (t.querySelector('tbody')?.textContent.slice(0, 200) || '') : 'none';
  };
  // A widget aszinkron tölt: addig várunk, amíg a táblázat megváltozik és 1,2 mp-ig stabil marad.
  const waitForReload = async previous => {
    let last = signature(), stable = 0;
    for (let i = 0; i < 40; i++) {
      await sleep(200);
      const s = signature();
      if (s === last) stable += 200; else { stable = 0; last = s; }
      if (s !== previous && stable >= 1200) return;
    }
  };

  const games = [];
  const tabNames = [...root.querySelectorAll('button[role=tab]')].map(b => b.textContent.trim()).filter(t => /^U/.test(t));
  for (const tab of tabNames.length ? tabNames : ['']) {
    if (tab) {
      const button = [...root.querySelectorAll('button[role=tab]')].find(b => b.textContent.trim() === tab);
      if (button.getAttribute('aria-selected') !== 'true') { const before = signature(); button.click(); await waitForReload(before); }
    }
    const phaseSelect = root.querySelector('#phases');
    const phases = phaseSelect ? [...phaseSelect.options].map(o => [o.value, o.text]) : [['', '']];
    for (const [value, phaseName] of phases) {
      const select = root.querySelector('#phases');
      if (select && select.value !== value) {
        const before = signature();
        select.value = value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        await waitForReload(before);
      }
      for (const tr of root.querySelectorAll('table tbody tr')) {
        const c = [...tr.querySelectorAll('td')].map(td => td.textContent.trim().replace(/\s+/g, ' '));
        // oszlopok: 0 #, 1 dátum, 2 idő, 3 hazai, 5 eredmény, 9 vendég, 10 helyszín
        if (/Debrecen/i.test(c[10] || '')) {
          games.push({ division: tab, phase: phaseName, date: c[1], time: c[2], home: c[3], away: c[9], venue: c[10] });
        }
      }
    }
  }
  console.table(games);
  return games;
})();
