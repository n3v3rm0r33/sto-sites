'use strict';
const input = document.getElementById('query');
const clear = document.getElementById('clear');
const status = document.getElementById('status');
const results = document.getElementById('results');
const copyStatus = document.getElementById('copy-status');
const normalizeName = value => value.toLocaleLowerCase('uk').normalize('NFD').replace(/\p{M}/gu, '').replace(/ґ/g, 'г').replace(/[^\p{L}\p{N}]/gu, '');
const digits = value => value.replace(/\D/g, '');
const normalizePhone = value => digits(value).replace(/^380(?=\d{9}$)/, '0');
let entries = [];
let exactMatches = [];

function render() {
  results.replaceChildren();
  copyStatus.textContent = '';
  exactMatches = [];
  const query = input.value.trim();
  const name = normalizeName(query);
  const phoneQuery = /^[+\d\s().-]+$/.test(query);
  const phone = normalizePhone(query);
  if (!name) {
    status.textContent = `Доступно сайтів: ${entries.length}. Введіть назву або телефон.`;
    return;
  }
  const matches = entries.map(entry => {
    const exact = phoneQuery ? phone === entry.phoneKey : name === entry.nameKey;
    const partial = phoneQuery ? phone.length > 0 && entry.phoneKey.includes(phone) : entry.nameKey.includes(name);
    return {entry, exact, partial};
  }).filter(match => match.partial).sort((a, b) => Number(b.exact) - Number(a.exact) || a.entry.name.localeCompare(b.entry.name, 'uk'));
  exactMatches = matches.filter(match => match.exact);
  status.textContent = matches.length ? `Знайдено: ${matches.length}.${exactMatches.length === 1 ? ' Enter — відкрити точний збіг.' : ''}` : 'Нічого не знайдено. Спробуйте частину назви або інші цифри номера.';
  for (const {entry} of matches) {
    const item = document.createElement('li');
    const title = document.createElement('h2');
    title.textContent = entry.name;
    const details = document.createElement('p');
    details.className = 'details';
    const readablePhone = entry.phone.replace(/^(\+380)(\d{2})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4 $5');
    details.textContent = [readablePhone || 'Телефон не вказано', entry.city].filter(Boolean).join(' · ');
    const url = document.createElement('a');
    url.className = 'url';
    url.href = entry.url;
    url.textContent = entry.url;
    const actions = document.createElement('div');
    actions.className = 'actions';
    const open = document.createElement('a');
    open.className = 'open';
    open.href = entry.url;
    open.textContent = 'Відкрити сайт';
    open.setAttribute('aria-label', `Відкрити сайт ${entry.name}`);
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.textContent = 'Копіювати URL';
    copy.setAttribute('aria-label', `Копіювати URL ${entry.name}`);
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(entry.url);
        copyStatus.textContent = `Посилання на ${entry.name} скопійовано.`;
      } catch (error) {
        if (!(error instanceof Error)) throw error;
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(url);
        selection.removeAllRanges();
        selection.addRange(range);
        copyStatus.textContent = 'Посилання виділено. Натисніть Ctrl+C / ⌘C або скопіюйте через меню браузера.';
      }
    });
    actions.append(open, copy);
    item.append(title, details, url, actions);
    results.append(item);
  }
}
input.addEventListener('input', render);
clear.addEventListener('click', () => { input.value = ''; render(); input.focus(); });
document.getElementById('search-form').addEventListener('submit', event => {
  event.preventDefault();
  if (exactMatches.length === 1) window.location.assign(exactMatches[0].entry.url);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && document.activeElement === input) { input.value = ''; render(); }
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && !document.activeElement.isContentEditable) { event.preventDefault(); input.focus(); }
});
(async () => {
  try {
    const response = await fetch('lookup-data.json', {signal: AbortSignal.timeout(10000)});
    if (!response.ok) throw new TypeError(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new TypeError('Expected a site list');
    entries = data.map(entry => {
      if (!entry || typeof entry.name !== 'string' || typeof entry.phone !== 'string' || typeof entry.url !== 'string' || typeof entry.city !== 'string' || !/^https:\/\/n3v3rm0r33\.github\.io\/sto-sites\/sto-\d+\/$/.test(entry.url)) throw new TypeError('Invalid site record');
      return {...entry, nameKey: normalizeName(entry.name), phoneKey: normalizePhone(entry.phone)};
    });
    input.disabled = false;
    clear.disabled = false;
    render();
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    status.textContent = 'Не вдалося завантажити посилання. Перевірте з’єднання й оновіть сторінку.';
  }
})();
