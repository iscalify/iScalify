/* Progressive enhancement: every guide stays readable when JavaScript is off */
(() => {
  const controls = document.getElementById('journal-controls');
  const cards = [...document.querySelectorAll('[data-article-card]')];
  const search = document.getElementById('journal-search');
  const count = document.getElementById('journal-result-count');
  const empty = document.getElementById('journal-empty');
  if (!controls || !search || !count || !empty || !cards.length) return;
  const update = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    cards.forEach(card => {
      const matchesSearch = !query || card.textContent.toLocaleLowerCase().includes(query);
      card.hidden = !matchesSearch;
      if (!card.hidden) visible += 1;
    });
    count.textContent = `${visible} ${visible === 1 ? 'guide' : 'guides'}`;
    empty.hidden = visible !== 0;
  };
  search.addEventListener('input', update);
  controls.hidden = false;
  update();
})();
