/* Progressive enhancement: every guide stays readable when JavaScript is off */
(() => {
  const controls = document.getElementById('journal-controls');
  const cards = [...document.querySelectorAll('[data-article-card]')];
  const search = document.getElementById('journal-search');
  const count = document.getElementById('journal-result-count');
  const empty = document.getElementById('journal-empty');
  if (!controls || !search || !count || !empty || !cards.length) return;
  const filters = [...controls.querySelectorAll('[data-market-filter]')];
  let market = 'all';
  const update = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    cards.forEach(card => {
      const markets = (card.dataset.markets || '').split('|');
      const matchesMarket = market === 'all' || markets.includes(market) || markets.includes('International');
      const matchesSearch = !query || card.textContent.toLocaleLowerCase().includes(query);
      card.hidden = !(matchesMarket && matchesSearch);
      if (!card.hidden) visible += 1;
    });
    count.textContent = `${visible} ${visible === 1 ? 'guide' : 'guides'}`;
    empty.hidden = visible !== 0;
  };
  filters.forEach(button => button.addEventListener('click', () => {
    market = button.dataset.marketFilter;
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    update();
  }));
  search.addEventListener('input', update);
  controls.hidden = false;
  update();
})();
