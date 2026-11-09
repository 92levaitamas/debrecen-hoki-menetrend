// Futtatás: Chrome DevTools Console-ban a https://www.jegkorongszovetseg.hu/versenynaptar oldalon.
// Az összes bajnokságot egy listában adja (felnőtt, női, 3x3, utánpótlás), de csak kb. 3 hétre előre.
// A „Még több” gombot addig nyomja, amíg el nem tűnik, utána kiírja a debreceni helyszínű meccseket.
(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const el = document.querySelector('mjsz-vbr-calendar');
  const root = el.shadowRoot || el;

  const nextGames = [...root.querySelectorAll('button')].find(b => b.innerText.trim() === 'KÖVETKEZŐ MÉRKŐZÉSEK');
  nextGames?.click();
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

  const games = [...root.querySelectorAll('[style*="grid-area: name"]')].map(nameCell => {
    const card = nameCell.parentElement;
    const venue = nameCell.querySelector('div')?.innerText.trim() || '';
    return {
      gameId: nameCell.querySelector('a')?.getAttribute('href')?.replace('/event/game/', ''),
      championship: nameCell.innerText.replace(venue, '').replace(/\s+/g, ' ').trim(),
      date: cell(card, 'date'),
      home: cell(card, 'home-team'),
      away: cell(card, 'away-team'), // tornánál „Torna”
      venue,
    };
  }).filter(g => /Debrecen/i.test(g.venue));

  console.table(games);
  return games;
})();
