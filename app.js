function logDiag(msg){
  const el = document.getElementById('diag');
  el.style.display = 'block';
  el.textContent += (el.textContent ? '\n' : '') + msg;
}
async function loadItems() {
  const url = 'items.json?v=' + Date.now();
  try{
    const res = await fetch(url, {cache: 'no-store'});
    if(!res.ok){
      logDiag('HTTP ' + res.status + ' while fetching ' + url);
      return [];
    }
    const data = await res.json();
    logDiag('Loaded ' + (Array.isArray(data) ? data.length : 0) + ' items');
    return Array.isArray(data) ? data : [];
  }catch(e){
    logDiag('Fetch error: ' + e.message);
    return [];
  }
}
function normalize(s){ return (s||'').toString().trim().toLowerCase(); }


function ensureThumbStyles(){
  if(document.getElementById('thumb-style')) return;
  const st = document.createElement('style');
  st.id = 'thumb-style';
  st.textContent = `
    .card .row{display:flex;gap:12px;align-items:center;}
    .card .col{flex:1;min-width:0;}
    .card .thumb{width:72px;height:72px;object-fit:contain;border-radius:10px;background:rgba(255,255,255,0.06);flex:0 0 auto;}
  `;
  document.head.appendChild(st);
}
function render(items){
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  grid.innerHTML = '';
  if(items.length === 0){ empty.style.display='block'; return; }
  empty.style.display='none';
  const frag = document.createDocumentFragment();
  for(const it of items){
    const name = it.name || it.product_name || '(이름 미상)';
    const loc  = it.location || it.location_code || '위치 미상';
    const manu = it.manufacturer || it.brand || '제조사 공란';
    const sub  = [it.dosage_form, it.strength, it.category].filter(Boolean).join(' · ');
    const id = it.id ? `<span class="badge">#${it.id}</span>` : '';
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="row">
        ${it.image ? `<img class="thumb" src="${it.image}" alt="${name}" loading="lazy" onerror="this.style.display='none'">` : ''}
        <div class="col">
          <h3 class="name">${name}</h3>
          <div class="meta">
            <span class="badge loc">${loc}</span>
            <span class="badge">${manu}</span>
            ${id}
          </div>
          ${sub ? `<div class="sub">${sub}</div>` : ''}
        </div>
      </div>
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
    const name = it.name || it.product_name || '(이름 미상)';
    const loc  = it.location || it.location_code || '위치 미상';
    const manu = it.manufacturer || it.brand || '제조사 공란';
    const sub  = [it.dosage_form, it.strength, it.category].filter(Boolean).join(' · ');
    const id = it.id ? `<span class="badge">#${it.id}</span>` : '';
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="row">
        ${it.image ? `<img class="thumb" src="${it.image}" alt="${name}" loading="lazy" onerror="this.style.display='none'">` : ''}
        <div class="col">
          <h3 class="name">${name}</h3>
          <div class="meta">
            <span class="badge loc">${loc}</span>
            <span class="badge">${manu}</span>
            ${id}
          </div>
          ${sub ? `<div class="sub">${sub}</div>` : ''}
        </div>
      </div>
    `;
frag.appendChild(card);
  }
  grid.appendChild(frag);
  document.getElementById('count').textContent = items.filter(x=>!x.__group).length.toLocaleString('ko-KR');
}

(async function main(){
  ensureThumbStyles();
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
