// Rechner: Basic + Profi 
(function(){
  const basicDisp = document.getElementById('basicDisplay');
  const basicHist = document.getElementById('basicHistory');
  const basicCard = document.getElementById('basicCalc');
  const proCard = document.getElementById('proCalc');
  let basicExpr = '';
  let basicHistory = JSON.parse(localStorage.getItem('basicHist')||'[]');

  document.querySelectorAll('.mode').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('.mode').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    const pro = b.dataset.mode==='pro';
    basicCard.classList.toggle('hidden',pro);
    proCard.classList.toggle('hidden',!pro);
  });

  function renderBasicHist(){
    basicHist.innerHTML='';
    basicHistory.slice(-20).reverse().forEach(h=>{
      const li=document.createElement('li');
      li.textContent=h.e+' = '+h.r;
      li.onclick=()=>{basicExpr=String(h.r);basicDisp.textContent=basicExpr;};
      basicHist.appendChild(li);
    });
  }
  renderBasicHist();

  basicCard.querySelectorAll('button[data-k]').forEach(btn=>btn.onclick=()=>{
    const k=btn.dataset.k;
    if(k==='C'){basicExpr='';basicDisp.textContent='0';return;}
    if(k==='±'){if(basicExpr.startsWith('-'))basicExpr=basicExpr.slice(1);else basicExpr='-'+basicExpr;basicDisp.textContent=basicExpr||'0';return;}
    if(k==='%'){try{const r=window.mathEval(basicExpr||'0')/100;basicExpr=String(r);basicDisp.textContent=basicExpr;}catch(e){}return;}
    if(k==='='){try{const r=window.mathEval(basicExpr||'0');basicHistory.push({e:basicExpr,r});localStorage.setItem('basicHist',JSON.stringify(basicHistory));basicExpr=String(r);basicDisp.textContent=basicExpr;renderBasicHist();}catch(e){basicDisp.textContent='Err';}return;}
    basicExpr+=k;basicDisp.textContent=basicExpr;
  });

  // ===== PRO =====
  const proDisp=document.getElementById('proDisplay');
  const proHist=document.getElementById('proHistory');
  const angleBtn=document.getElementById('angleMode');
  const ansLabel=document.getElementById('ansLabel');
  let proExpr='';
  let ans=0;
  let deg=true;
  let proHistory=JSON.parse(localStorage.getItem('proHist')||'[]');
  let vars=JSON.parse(localStorage.getItem('proVars')||'{}');

  angleBtn.onclick=()=>{deg=!deg;angleBtn.textContent=deg?'DEG':'RAD';};

  function renderProHist(){
    proHist.innerHTML='';
    proHistory.slice(-20).reverse().forEach(h=>{
      const li=document.createElement('li');li.textContent=h.e+' = '+h.r;
      li.onclick=()=>{proExpr=String(h.r);proDisp.textContent=proExpr;};
      proHist.appendChild(li);
    });
  }

  function renderVars(){
    const list=document.getElementById('varList');
    list.innerHTML='';
    Object.keys(vars).forEach(k=>{
      const row=document.createElement('div');row.className='var-row';
      row.innerHTML=`<span><b>${k}</b> = ${vars[k]}</span><span class="del">×</span>`;
      row.querySelector('.del').onclick=()=>{
        delete vars[k];
        localStorage.setItem('proVars',JSON.stringify(vars));
        renderVars();
      };
      list.appendChild(row);
    });
  }

  renderProHist();renderVars();

  document.getElementById('varAdd').onclick=()=>{
    const n=document.getElementById('varName').value.trim();
    const v=parseFloat(document.getElementById('varVal').value);
    if(!n||isNaN(v))return;
    vars[n]=v;
    localStorage.setItem('proVars',JSON.stringify(vars));
    renderVars();
  };

  proCard.querySelectorAll('.pro-keys button[data-k]').forEach(btn=>btn.onclick=()=>{
    const k=btn.dataset.k;
    if(k==='C'){proExpr='';proDisp.textContent='0';return;}
    if(k==='DEL'){proExpr=proExpr.slice(0,-1);proDisp.textContent=proExpr||'0';return;}
    if(k==='ans'){proExpr+=String(ans);proDisp.textContent=proExpr;return;}
    if(k==='='){
      try{
        const r=window.mathEval(proExpr||'0',vars,{deg});
        ans=r;
        ansLabel.textContent=String(r);
        proHistory.push({e:proExpr,r});
        localStorage.setItem('proHist',JSON.stringify(proHistory));
        proExpr=String(r);
        proDisp.textContent=proExpr;
        renderProHist();
      }catch(e){
        proDisp.textContent='Err: '+e.message;
      }
      return;
    }
    proExpr+=k;
    proDisp.textContent=proExpr;
  });

  // ===== PLOT (FIXED) =====
  function normalizeExpr(expr){
    // erlaubt "y = x^2 + 1"
    return expr
      .replace(/^\s*y\s*=\s*/i,'')
      .trim();
  }

  function plot(){
    let expr = normalizeExpr(document.getElementById('plotExpr').value);

    const xmin=parseFloat(document.getElementById('plotMin').value);
    const xmax=parseFloat(document.getElementById('plotMax').value);
    const area=document.getElementById('plotArea');

    const W=area.clientWidth||600, H=260, N=400;
    const pts=[];
    let ymin=Infinity,ymax=-Infinity;

    for(let i=0;i<=N;i++){
      const x=xmin+(xmax-xmin)*i/N;
      try{
        const y=window.mathEval(expr,{x,...vars},{deg});

        if(isFinite(y)){
          pts.push([x,y]);
          if(y<ymin)ymin=y;
          if(y>ymax)ymax=y;
        } else {
          pts.push(null);
        }
      }catch(e){
        area.innerHTML='<p style="color:var(--danger)">Fehler: '+e.message+'</p>';
        return;
      }
    }

    if(!isFinite(ymin)){
      area.innerHTML='<p style="color:var(--muted)">Keine Werte.</p>';
      return;
    }

    if(ymin===ymax){ymin-=1;ymax+=1;}

    const pad=42;
    const sx=x=>pad+(x-xmin)/(xmax-xmin)*(W-2*pad);
    const sy=y=>H-pad-(y-ymin)/(ymax-ymin)*(H-2*pad);

    let path='';let pen=false;
    pts.forEach(p=>{
      if(!p){pen=false;return;}
      path+=(pen?'L':'M')+sx(p[0]).toFixed(1)+','+sy(p[1]).toFixed(1)+' ';
      pen=true;
    });

    const y0=ymin<=0&&ymax>=0?sy(0):H-pad;
    const x0=xmin<=0&&xmax>=0?sx(0):pad;

    function niceStep(range,target){
      const raw=range/target;
      const mag=Math.pow(10,Math.floor(Math.log10(raw)));
      const norm=raw/mag;
      let step;
      if(norm<1.5)step=1;
      else if(norm<3)step=2;
      else if(norm<7)step=5;
      else step=10;
      return step*mag;
    }

    function ticks(min,max,target){
      const step=niceStep(max-min,target);
      const start=Math.ceil(min/step)*step;
      const arr=[];
      for(let v=start;v<=max+step*1e-9;v+=step)
        arr.push(+v.toFixed(12));
      return arr;
    }

    function fmtT(v){
      if(v===0) return '0';
      const a=Math.abs(v);
      if(a>=1e5||a<1e-3) return v.toExponential(1);
      return parseFloat(v.toPrecision(4)).toString();
    }

    const xt=ticks(xmin,xmax,8);
    const yt=ticks(ymin,ymax,6);

    let gridX='', gridY='', ticksX='', ticksY='';

    xt.forEach(v=>{
      const x=sx(v);
      gridX+=`<line x1="${x}" x2="${x}" y1="${pad}" y2="${H-pad}" stroke="#1c274a" stroke-width="1"/>`;
      ticksX+=`<line x1="${x}" x2="${x}" y1="${H-pad}" y2="${H-pad+4}" stroke="#8a96bc"/>`;
      ticksX+=`<text x="${x}" y="${H-pad+16}" fill="#8a96bc" font-size="10" font-family="monospace" text-anchor="middle">${fmtT(v)}</text>`;
    });

    yt.forEach(v=>{
      const y=sy(v);
      gridY+=`<line x1="${pad}" x2="${W-pad}" y1="${y}" y2="${y}" stroke="#1c274a" stroke-width="1"/>`;
      ticksY+=`<line x1="${pad-4}" x2="${pad}" y1="${y}" y2="${y}" stroke="#8a96bc"/>`;
      ticksY+=`<text x="${pad-6}" y="${y+3}" fill="#8a96bc" font-size="10" font-family="monospace" text-anchor="end">${fmtT(v)}</text>`;
    });

    area.innerHTML=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${W}" height="${H}" fill="transparent"/>
      ${gridX}${gridY}
      <line x1="${pad}" x2="${W-pad}" y1="${y0}" y2="${y0}" stroke="#3a4a7a" stroke-width="1.2"/>
      <line x1="${x0}" x2="${x0}" y1="${pad}" y2="${H-pad}" stroke="#3a4a7a" stroke-width="1.2"/>
      ${ticksX}${ticksY}
      <text x="${W-pad+4}" y="${y0+4}" fill="#8a96bc" font-size="11" font-family="monospace">x</text>
      <text x="${x0-4}" y="${pad-6}" fill="#8a96bc" font-size="11" font-family="monospace" text-anchor="end">y</text>
      <path d="${path}" fill="none" stroke="#22d3ee" stroke-width="2"/>
    </svg>`;

    localStorage.setItem('plotExpr',document.getElementById('plotExpr').value);
  }

  document.getElementById('plotBtn').onclick=plot;

  const saved=localStorage.getItem('plotExpr');
  if(saved)document.getElementById('plotExpr').value=saved;

  // ===== MATRIX =====
  function buildMat(id,n){
    const el=document.getElementById(id);
    el.innerHTML='';
    el.className='mat-grid';
    el.style.gridTemplateColumns=`repeat(${n},1fr)`;
    for(let i=0;i<n*n;i++){
      const ip=document.createElement('input');ip.type='number';ip.value=0;ip.step='any';
      el.appendChild(ip);
    }
  }

  function readMat(id,n){
    const ins=document.getElementById(id).querySelectorAll('input');
    const m=[];
    for(let i=0;i<n;i++){
      m.push([]);
      for(let j=0;j<n;j++){
        m[i].push(parseFloat(ins[i*n+j].value)||0);
      }
    }
    return m;
  }

  function fmt(m){
    if(typeof m==='number')return String(m);
    return m.map(r=>r.map(v=>v.toFixed(4).padStart(10)).join(' ')).join('\n');
  }

  function add(a,b){return a.map((r,i)=>r.map((v,j)=>v+b[i][j]));}
  function sub(a,b){return a.map((r,i)=>r.map((v,j)=>v-b[i][j]));}

  function mul(a,b){
    const n=a.length,r=[];
    for(let i=0;i<n;i++){
      r.push([]);
      for(let j=0;j<n;j++){
        let s=0;
        for(let k=0;k<n;k++)s+=a[i][k]*b[k][j];
        r[i].push(s);
      }
    }
    return r;
  }

  function transp(a){return a[0].map((_,j)=>a.map(r=>r[j]));}

  function det(a){
    const n=a.length;
    if(n===1)return a[0][0];
    if(n===2)return a[0][0]*a[1][1]-a[0][1]*a[1][0];
    let d=0;
    for(let j=0;j<n;j++){
      const sub=a.slice(1).map(r=>r.filter((_,k)=>k!==j));
      d+=(j%2?-1:1)*a[0][j]*det(sub);
    }
    return d;
  }

  function inv(a){
    const n=a.length,d=det(a);
    if(Math.abs(d)<1e-12)return null;

    const c=[];
    for(let i=0;i<n;i++){
      c.push([]);
      for(let j=0;j<n;j++){
        const sub=a.filter((_,r)=>r!==i).map(r=>r.filter((_,k)=>k!==j));
        c[i].push(((i+j)%2?-1:1)*det(sub));
      }
    }
    return transp(c).map(r=>r.map(v=>v/d));
  }

  function rebuild(){
    const n=parseInt(document.getElementById('matSize').value);
    buildMat('matA',n);
    buildMat('matB',n);
  }

  document.getElementById('matSize').onchange=rebuild;
  rebuild();

  document.querySelectorAll('[data-mop]').forEach(b=>b.onclick=()=>{
    const n=parseInt(document.getElementById('matSize').value);
    const A=readMat('matA',n),B=readMat('matB',n);
    let r;

    try{
      switch(b.dataset.mop){
        case'A+B':r=add(A,B);break;
        case'A-B':r=sub(A,B);break;
        case'A*B':r=mul(A,B);break;
        case'detA':r=det(A);break;
        case'invA':r=inv(A);if(!r)throw new Error('singulär');break;
        case'trA':r=transp(A);break;
      }
      document.getElementById('matResult').textContent=fmt(r);
    }catch(e){
      document.getElementById('matResult').textContent='Fehler: '+e.message;
    }
  });
})();