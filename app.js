async function loadItems() {
  const res = await fetch('items.json', {cache: 'no-store'});
  return await res.json();
}
function normalize(s){ return (s||'').toString().trim().toLowerCase(); }

function render(items){
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  grid.innerHTML = '';
  if(items.length === 0){ empty.style.display='block'; return; }
  empty.style.display='none';
  const frag = document.createDocumentFragment();
  for(const it of items){
    const sub = [it.dosage_form, it.strength, it.category].filter(Boolean).join(' · ');
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3 class="name">${it.name || it.product_name || '(이름 미상)'}</h3>
      <div class="meta">
        <span class="badge loc">${it.location || it.location_code || '위치 미상'}</span>
        <span class="badge">${it.manufacturer || it.brand || '제조사 공란'}</span>
        ${it.id ? `<span class="badge">#${it.id}</span>` : ''}
      </div>
      ${sub ? `<div class="sub">${sub}</div>` : ''}
    `;
    frag.appendChild(card);
  }
  grid.appendChild(frag);
  document.getElementById('count').textContent = items.length.toLocaleString('ko-KR');
}

function groupBy(items, key){
  const mp = new Map();
  for(const it of items){
    const k = (it[key]||'').toString().trim() || '(공란)';
    if(!mp.has(k)) mp.set(k, []);
    mp.get(k).push(it);
  }
  // flatten groups with simple headings
  const out = [];
  const keys = Array.from(mp.keys()).sort((a,b)=>a.localeCompare(b,'ko'));
  for(const k of keys){
    out.push({__group:true, label:`${key}: ${k}`});
    for(const it of mp.get(k)) out.push(it);
  }
  return out;
}

function renderWithGroups(items, key){
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  grid.innerHTML = '';
  if(items.length === 0){ empty.style.display='block'; return; }
  empty.style.display='none';
  const frag = document.createDocumentFragment();
  for(const it of items){
    if(it.__group){
      const h = document.createElement('div');
      h.className = 'card';
      h.innerHTML = `<div class="name" style="font-size:14px;opacity:0.85;">${it.label}</div>`;
      frag.appendChild(h);
      continue;
    }
    const sub = [it.dosage_form, it.strength, it.category].filter(Boolean).join(' · ');
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3 class="name">${it.name || it.product_name || '(이름 미상)'}</h3>
      <div class="meta">
        <span class="badge loc">${it.location || it.location_code || '위치 미상'}</span>
        <span class="badge">${it.manufacturer || it.brand || '제조사 공란'}</span>
        ${it.id ? `<span class="badge">#${it.id}</span>` : ''}
      </div>
      ${sub ? `<div class="sub">${sub}</div>` : ''}
    `;
    frag.appendChild(card);
  }
  grid.appendChild(frag);
  document.getElementById('count').textContent = items.filter(x=>!x.__group).length.toLocaleString('ko-KR');
}

(async function main(){
  let all = await loadItems();

  const q = document.getElementById('q');
  const sort = document.getElementById('sort');
  const group = document.getElementById('group');

  function apply(){
    const query = normalize(q.value);
    let view = all.filter(it => {
      const hay = normalize([it.name, it.product_name, it.manufacturer, it.brand, it.location, it.location_code, it.id, it.dosage_form, it.category, it.strength, it.tags, it.indications].join(' '));
      return hay.includes(query);
    });
    const key = sort.value;
    view.sort((a,b)=> (a[key]||'').toString().localeCompare((b[key]||'').toString(),'ko'));
    const g = group.value;
    if(g){
      const grouped = groupBy(view, g);
      renderWithGroups(grouped, g);
    } else {
      render(view);
    }
  }

  q.addEventListener('input', apply);
  sort.addEventListener('change', apply);
  group.addEventListener('change', apply);

  apply();
})();