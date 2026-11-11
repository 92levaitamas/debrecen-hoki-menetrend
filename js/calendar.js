// Összesített versenynaptár (/versenynaptar): minden bajnokság, de csak kb. 3 hétre előre.
async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < 80 && !document.querySelector('mjsz-vbr-calendar')?.shadowRoot?.querySelector('button'); i++) await sleep(250);
  const el = document.querySelector('mjsz-vbr-calendar');
  const root = el.shadowRoot || el;

  [...root.querySelectorAll('button')].find(b => b.innerText.trim() === 'KÖVETKEZŐ MÉRKŐZÉSEK')?.click();
  await sleep(3000);
  for (let i = 0; i < 150; i++) {
    const more = [...root.querySelectorAll('button,a')].find(x => (x.innerText || '').trim() === 'Még több');
    if (!more) break;
    more.click();
    await sleep(1200);
  }

  const cell = (card, area) => [...card.children]
    .find(x => new RegExp('grid-area:\\s*' + area + '\\s*(;|$)').test(x.getAttribute('style') || ''))
    ?.innerText.replace(/\s+/g, ' ').trim() || '';

  return [...root.querySelectorAll('[style*="grid-area: name"]')].map(nameCell => {
    const card = nameCell.parentElement;
    const venue = nameCell.querySelector('div')?.innerText.trim() || '';
    // pl. „U14 197 - U-14 Bajnokság - U-14 A - Alapszakasz”
    const [code, ...competition] = nameCell.innerText.replace(venue, '').replace(/\s+/g, ' ').trim().split(' - ');
    const [date, time] = cell(card, 'date').replace(' (CET)', '').split(' ');
    return { code, competition: competition.join(' – '), date, time, home: cell(card, 'home-team'), away: cell(card, 'away-team'), venue };
  }).filter(g => /Debrecen/i.test(g.venue));
}
