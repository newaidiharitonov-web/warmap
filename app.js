// ===== Карта =====
const map = L.map('map', { zoomControl: true }).setView([48.7, 36.5], 6);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '(c) OpenStreetMap contributors, (c) CARTO',
  subdomains: 'abcd', maxZoom: 19
}).addTo(map);

// ===== Типы событий =====
// Добавить/убрать тип можно правкой только этого списка:
const TYPES = {
  strike:   { icon: '(exp)', label: 'Удар / ракета' },
  shelling: { icon: '(fire)', label: 'Обстрел' },
  clash:    { icon: '(clash)', label: 'Боестолкновение' },
  drone:    { icon: '(drone)', label: 'Дроны / БПЛА' },
  movement: { icon: '(move)', label: 'Перемещение техники' },
  info:     { icon: '(i)', label: 'Информация' }
};

let eventsLayer = null;
let eventsData = null;
let currentType = null; // если задан — показываем только один тип

// ===== Загрузка версии по дате =====
async function loadDate(date) {
  if (eventsLayer) map.removeLayer(eventsLayer);

  eventsData = await fetch('data/events-' + date + '.geojson').then(r => r.json());
  renderEvents();
  document.getElementById('updated').textContent = 'Обновлено: ' + date;
}

function renderEvents() {
  if (eventsLayer) map.removeLayer(eventsLayer);

  eventsLayer = L.geoJSON(eventsData, {
    filter: f => !currentType || f.properties.type === currentType,
    pointToLayer: (f, latlng) => L.marker(latlng, {
      icon: L.divIcon({
        className: '',
        html: (TYPES[f.properties.type] || {}).icon || '(?)',
        iconSize: [34, 18], iconAnchor: [17, 9]
      })
    }),
    onEachFeature: (f, layer) => layer.bindPopup(
      '<b>' + (TYPES[f.properties.type] || {}).label + ': ' + f.properties.title + '</b><br>' +
      (f.properties.time || '') + '<br>' + (f.properties.desc || '')
    )
  }).addTo(map);
}

// ===== Панель: даты и фильтры =====
fetch('data/versions.json').then(r => r.json()).then(meta => {
  // Даты
  const sel = document.getElementById('dateSelect');
  meta.dates.forEach(d => {
    const o = document.createElement('option');
    o.value = o.textContent = d;
    sel.appendChild(o);
  });
  sel.value = meta.dates[meta.dates.length - 1];
  sel.onchange = () => loadDate(sel.value);

  // Фильтры по типам: "Все" + по одному на тип
  const box = document.getElementById('filters');
  const all = document.createElement('label');
  all.innerHTML = '<input type="radio" name="tfilter" checked> Все события';
  all.querySelector('input').onchange = () => { currentType = null; renderEvents(); };
  box.appendChild(all);

  Object.keys(TYPES).forEach(t => {
    const l = document.createElement('label');
    l.innerHTML = '<span class="swatch">' + TYPES[t].icon + '</span>' +
      '<input type="radio" name="tfilter" style="margin-left:2px"> ' + TYPES[t].label;
    l.querySelector('input').onchange = () => { currentType = t; renderEvents(); };
    box.appendChild(l);
  });

  loadDate(sel.value);
});
