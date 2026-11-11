// Bajnoksági oldal (pl. /u14/bajnoksag): az aktuális szezon összes divíziója és szakasza.
// Playwright page.evaluate-tel fut; kézzel a DevTools Console-ban: bemásolás után `()`-val hívd meg.
async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  // Betöltés közben a szakasz-választóban csak egy „Nincsenek szakaszok” helykitöltő van.
  const phasesLoaded = () => [...(document.querySelector('mjsz-vbr-championship')?.shadowRoot?.querySelectorAll('#phases option') || [])]
    .some(o => o.text.trim() !== 'Nincsenek szakaszok');
  for (let i = 0; i < 120 && !phasesLoaded(); i++) await sleep(250);
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

  await waitForReload('none'); // az első szakasz táblázata a szakasz-lista után érkezik

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
      console.log(`${tab} / ${phaseName}: ${root.querySelectorAll('table tbody tr').length} sor`);
      for (const tr of root.querySelectorAll('table tbody tr')) {
        // a csapat-cellában hosszú és rövid név is van (`UTE A` + `UTE`), csak a hosszú kell
        const c = [...tr.querySelectorAll('td')].map(td => (td.querySelector('.is-team-name-long') || td).textContent.trim().replace(/\s+/g, ' '));
        // oszlopok: 0 kód, 1 dátum, 2 idő, 3 hazai, 9 vendég, 10 helyszín
        if (/Debrecen/i.test(c[10] || '')) {
          games.push({ code: c[0], competition: [tab, phaseName].filter(Boolean).join(' – '), date: c[1], time: c[2], home: c[3], away: c[9], venue: c[10] });
        }
      }
    }
  }
  return games;
}
