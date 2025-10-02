
// Diagnostic version: shows errors on the page and bypasses cache
const DIAG = document.createElement('div');
DIAG.style.cssText = 'position:fixed;bottom:8px;left:8px;right:8px;background:#1b2836;color:#cfe2ff;border:1px solid #335379;border-radius:10px;padding:8px;font:12px/1.4 system-ui;z-index:9999;white-space:pre-wrap;';
document.addEventListener('DOMContentLoaded', ()=>document.body.appendChild(DIAG));
function log(msg){ DIAG.textContent += (DIAG.textContent ? '\n' : '') + msg; }

async function loadItems() {
  const url = 'items.v2.json?v=' + Date.now();
  log('Fetching: ' + url);
  const res = await fetch(url, {cache: 'no-store'});
  log('HTTP ' + res.status + ' ' + res.statusText);
  if(!res.ok){
    const t = await res.text();
    log('Body preview: ' + t.slice(0,200));
    throw new Error('Failed to load items.json');
  }
  const data = await res.json();
  log('Loaded ' + (Array.isArray(data) ? data.length : 0) + ' items');
  return data;
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
  try{
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
    log('Render complete.');
  }catch(err){
    log('ERROR: ' + err.message);
  }
})();
