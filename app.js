// 약품 조회 앱 (정적 JSON 사용)
const STATE = {
  data: [],
  filtered: [],
  categories: new Set(),
  activeCategory: null
};

const els = {
  search: document.getElementById('searchInput'),
  clear: document.getElementById('clearBtn'),
  chips: document.getElementById('categoryChips'),
  stats: document.getElementById('stats'),
  results: document.getElementById('results'),
  cardTpl: document.getElementById('cardTpl'),
  dialog: document.getElementById('detailDialog'),
  closeDialog: document.getElementById('closeDialog'),
  d: {
    title: document.getElementById('dTitle'),
    ind: document.getElementById('dIndications'),
    brand: document.getElementById('dBrand'),
    str: document.getElementById('dStrength'),
    form: document.getElementById('dForm'),
    cat: document.getElementById('dCategory'),
    loc: document.getElementById('dLocation'),
    notes: document.getElementById('dNotes'),
    img: document.getElementById('dImage'),
    shelf: document.getElementById('dShelfMap'),
  }
};

// 1) 데이터 로드
async function load() {
  const res = await fetch('약품조회.json');
  const raw = await res.json();
  // 표준화: 키 이름을 JS 내부 표준으로 매핑
  const norm = raw.map(r => ({
    id: r.id ?? null,
    name: r.product_name ?? '',
    brand: r.brand ?? '',
    strength: r.strength ?? '',
    form: r.dosage_form ?? '',
    category: r.category ?? '',
    indications: r.indications ?? '',
    location: r.location_code ?? '',
    shelf_map_url: r.shelf_map_url ?? '',
    tags: (r.tags ?? '').split(',').map(s => s.trim()).filter(Boolean),
    notes: r.notes ?? '',
    image_url: r.image_url ?? '' // 현재 스키마에는 없지만 확장 대비
  }));
  STATE.data = norm;
  STATE.categories = new Set(norm.map(x => x.category).filter(Boolean));
  renderChips();
  applyFilter();
}

// 2) 카테고리 칩 렌더
function renderChips() {
  els.chips.innerHTML = '';
  const allChip = chip('전체', null);
  els.chips.appendChild(allChip);
  [...STATE.categories].sort().forEach(cat => {
    els.chips.appendChild(chip(cat, cat));
  });
  updateActiveChip();
}

function chip(label, value) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.textContent = label;
  b.onclick = () => {
    STATE.activeCategory = value;
    updateActiveChip();
    applyFilter();
  };
  b.dataset.value = value ?? '';
  return b;
}

function updateActiveChip() {
  const buttons = els.chips.querySelectorAll('.chip');
  buttons.forEach(btn => {
    const val = btn.dataset.value || null;
    btn.classList.toggle('active', val === (STATE.activeCategory ?? ''));
  });
}

// 3) 필터 적용 (검색 + 카테고리)
function applyFilter() {
  const q = (els.search.value || '').trim().toLowerCase();
  const cat = STATE.activeCategory;

  STATE.filtered = STATE.data.filter(item => {
    const inCat = !cat || item.category === cat;
    if (!inCat) return false;
    if (!q) return true;
    const hay = [
      item.name, item.brand, item.indications, item.location, item.strength, item.form,
      ...item.tags
    ].join(' ').toLowerCase();
    return hay.includes(q);
  });

  render();
}

// 4) 결과 렌더
function render() {
  els.results.innerHTML = '';
  els.stats.textContent = `${STATE.filtered.length}건 표시`;

  STATE.filtered.forEach(item => {
    const node = els.cardTpl.content.cloneNode(true);
    const img = node.querySelector('.thumb');
    const title = node.querySelector('.title');
    const ind = node.querySelector('.indications');
    const strength = node.querySelector('.strength');
    const form = node.querySelector('.dosage_form');
    const location = node.querySelector('.location');
    const tags = node.querySelector('.tags');

    img.src = item.image_url || 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="100%" height="100%" fill="#1a1a1e"/><text x="50%" y="50%" fill="#6b6b72" font-size="14" dominant-baseline="middle" text-anchor="middle">${item.category || '이미지 없음'}</text></svg>`);
    title.textContent = item.name || '(무제)';
    ind.textContent = item.indications || '';
    strength.textContent = item.strength || '';
    form.textContent = item.form || '';
    location.textContent = item.location ? `위치 ${item.location}` : '위치 정보 없음';

    item.tags.forEach(t => {
      const s = document.createElement('span');
      s.className = 'tag';
      s.textContent = `#${t}`;
      tags.appendChild(s);
    });

    // 상세 보기
    node.querySelector('.card').onclick = () => openDetail(item);
    els.results.appendChild(node);
  });
}

// 5) 상세 다이얼로그
function openDetail(item) {
  els.d.title.textContent = item.name;
  els.d.ind.textContent = item.indications || '';
  els.d.brand.textContent = item.brand || '-';
  els.d.str.textContent = item.strength || '-';
  els.d.form.textContent = item.form || '-';
  els.d.cat.textContent = item.category || '-';
  els.d.loc.textContent = item.location || '-';
  els.d.notes.textContent = item.notes || '-';
  els.d.img.src = item.image_url || '';
  els.d.img.style.display = item.image_url ? 'block' : 'none';

  if (item.shelf_map_url) {
    els.d.shelf.href = item.shelf_map_url;
    els.d.shelf.hidden = false;
  } else {
    els.d.shelf.hidden = true;
  }

  document.getElementById('detailDialog').showModal();
}

function closeDetail() {
  document.getElementById('detailDialog').close();
}

// 이벤트
els.search.addEventListener('input', debounce(applyFilter, 120));
els.clear.addEventListener('click', () => { els.search.value=''; applyFilter(); });
els.closeDialog.addEventListener('click', closeDetail);

// 간단한 디바운스
function debounce(fn, delay=150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), delay);
  };
}

// 시작
load();
