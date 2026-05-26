// Formeln-Tab
(function(){
  const F = window.FORMULAS || [];
  document.getElementById('formulaCount').textContent = F.length;
  document.getElementById('globalStats').textContent = F.length + ' Formeln';
  const cats = {};
  F.forEach(f => cats[f.cat] = (cats[f.cat]||0)+1);
  const catNames = Object.keys(cats).sort();

  const chipsEl = document.getElementById('catChips');
  const listEl = document.getElementById('formulaList');
  const searchEl = document.getElementById('search');
  let activeCat = 'Alle';
  let query = '';

  function renderChips(){
    chipsEl.innerHTML = '';
    const all = document.createElement('button');
    all.className = 'chip'+(activeCat==='Alle'?' active':'');
    all.innerHTML = `Alle <small>${F.length}</small>`;
    all.onclick = ()=>{activeCat='Alle';render();};
    chipsEl.appendChild(all);
    catNames.forEach(c=>{
      const b = document.createElement('button');
      b.className = 'chip'+(activeCat===c?' active':'');
      b.innerHTML = `${c} <small>${cats[c]}</small>`;
      b.onclick = ()=>{activeCat=c;render();};
      chipsEl.appendChild(b);
    });
  }
  function match(f){
    if(activeCat!=='Alle' && f.cat!==activeCat)return false;
    if(!query) return true;
    const q = query.toLowerCase();
    return f.name.toLowerCase().includes(q)
      || f.formula.toLowerCase().includes(q)
      || (f.desc||'').toLowerCase().includes(q)
      || f.cat.toLowerCase().includes(q)
      || Object.keys(f.vars||{}).some(v=>v.toLowerCase().includes(q));
  }
  function render(){
    renderChips();
    listEl.innerHTML = '';
    const items = F.filter(match).slice(0, 400);
    items.forEach(f=>listEl.appendChild(card(f)));
    if(!items.length) listEl.innerHTML='<p style="color:var(--muted)">Keine Formel gefunden.</p>';
  }

  function card(f){
    const el = document.createElement('div');
    el.className = 'fcard collapsed';
    const solKeys = Object.keys(f.solutions||{});
    const targets = solKeys.length ? solKeys : [f.result];
    el.innerHTML = `
      <div class="fcard-head">
        <div class="fcard-head-text">
          <div class="cat">${f.cat}</div>
          <h3>${f.name}</h3>
        </div>
        <button class="toggle" aria-label="Aufklappen">▾</button>
      </div>
      <div class="fcard-body">
        <div class="formula">${f.formula}</div>
        ${f.desc?`<div class="desc">${f.desc}</div>`:''}
        <div class="solve-row">
          <span>Auflösen nach:</span>
          <select class="solveSel">
            ${targets.map(t=>`<option value="${t}">${t}${f.vars&&f.vars[t]?` (${f.vars[t].n||''})`:''}</option>`).join('')}
          </select>
        </div>
        <div class="rearranged"></div>
        <div class="inputs"></div>
        <div class="actions">
          <button class="primary calcBtn">Berechnen</button>
        </div>
        <div class="res">—</div>
      </div>
    `;
    const head = el.querySelector('.fcard-head');
    const toggle = el.querySelector('.toggle');
    head.onclick = ()=>{
      const willOpen = el.classList.contains('collapsed');
      if(willOpen){
        listEl.querySelectorAll('.fcard').forEach(c=>{
          if(c!==el){
            c.classList.add('collapsed');
            const t = c.querySelector('.toggle');
            if(t) t.textContent='▾';
          }
        });
      }
      el.classList.toggle('collapsed');
      toggle.textContent = el.classList.contains('collapsed') ? '▾' : '▴';
    };

    const inputsDiv = el.querySelector('.inputs');
    const sel = el.querySelector('.solveSel');
    const resEl = el.querySelector('.res');
    const rearrEl = el.querySelector('.rearranged');

    const RESERVED = new Set(['pi','e','sin','cos','tan','asin','acos','atan','atan2','sinh','cosh','tanh','log','log10','log2','ln','exp','sqrt','cbrt','abs','floor','ceil','round','min','max','pow','mod','sign']);
    function extractIdents(expr){
      const ids = new Set();
      const re = /[A-Za-z_][A-Za-z0-9_]*/g;
      let m;
      while((m = re.exec(expr))){
        if(!RESERVED.has(m[0])) ids.add(m[0]);
      }
      return [...ids];
    }

    function buildInputs(){
      const target = sel.value;
      const expr = (f.solutions||{})[target] || '';
      if(expr){
        rearrEl.innerHTML = `<small>Umgestellt:</small><div class="formula">${target} = ${expr}</div>`;
      } else {
        rearrEl.innerHTML = '';
      }
      inputsDiv.innerHTML = '';
      const declared = Object.keys(f.vars||{}).filter(v=>v!==target);
      const exprIds = expr ? extractIdents(expr).filter(v=>v!==target) : [];
      // Union: declared vars that appear in expr (or all declared if no expr), plus any new idents from expr
      const base = expr ? declared.filter(v=>exprIds.includes(v)) : declared;
      const all = [...new Set([...base, ...exprIds])];
      all.forEach(v=>{
        const meta = (f.vars && f.vars[v]) || {};
        const row = document.createElement('div');
        row.className = 'varin';
        row.innerHTML = `<label><b>${v}</b> ${meta.n?`<small>${meta.n}</small>`:''} ${meta.u?`<small>[${meta.u}]</small>`:''}</label>
          <input type="number" data-var="${v}" step="any" placeholder="Wert">`;
        inputsDiv.appendChild(row);
      });
      if(!(f.solutions||{})[target]){
        const w = document.createElement('div');
        w.className='no-rev';
        w.textContent='Manuelle Umstellung für diese Variable nicht hinterlegt.';
        inputsDiv.appendChild(w);
      }
    }
    sel.onclick = e=>e.stopPropagation();
    sel.onchange = buildInputs;
    buildInputs();

    el.querySelector('.calcBtn').onclick = (e)=>{
      e.stopPropagation();
      const target = sel.value;
      const expr = (f.solutions||{})[target];
      if(!expr){resEl.textContent='Keine Umstellung verfügbar';resEl.classList.add('err');return;}
      const vars = {};
      el.querySelectorAll('input[data-var]').forEach(i=>{
        vars[i.dataset.var] = parseFloat(i.value);
      });
      try{
        const r = window.mathEval(expr, vars, {deg:true});
        const unit = (f.vars && f.vars[target] && f.vars[target].u) || '';
        resEl.classList.remove('err');
        resEl.textContent = `${target} = ${formatNum(r)} ${unit}`;
      }catch(err){
        resEl.classList.add('err');
        resEl.textContent = 'Fehler: '+err.message;
      }
    };
    // Stop body clicks from collapsing the card
    el.querySelector('.fcard-body').onclick = e=>e.stopPropagation();
    return el;
  }

  function formatNum(n){
    if(!isFinite(n))return String(n);
    if(Math.abs(n)>=1e6||Math.abs(n)<1e-4&&n!==0) return n.toExponential(6);
    return Math.round(n*1e8)/1e8;
  }

  searchEl.addEventListener('input', e=>{query=e.target.value;render();});
  document.addEventListener('keydown', e=>{
    if(e.key==='/' && document.activeElement.tagName!=='INPUT'){
      e.preventDefault(); searchEl.focus();
    }
  });
  render();
})();
