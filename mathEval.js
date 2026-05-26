// Safe math expression evaluator: shunting-yard + RPN
(function(){
  const FUNCS = {
    sin:Math.sin,cos:Math.cos,tan:Math.tan,
    asin:Math.asin,acos:Math.acos,atan:Math.atan,
    sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,
    log:Math.log,log10:Math.log10,ln:Math.log,exp:Math.exp,
    sqrt:Math.sqrt,abs:Math.abs,floor:Math.floor,ceil:Math.ceil,round:Math.round,
    min:Math.min,max:Math.max,pow:Math.pow,
    fact:function(n){if(n<0||n!==Math.floor(n))return NaN;let r=1;for(let i=2;i<=n;i++)r*=i;return r;}
  };
  const CONSTS = {pi:Math.PI,e:Math.E,PI:Math.PI};
  const OPS = {
    '+':{p:1,a:'L',f:(a,b)=>a+b},
    '-':{p:1,a:'L',f:(a,b)=>a-b},
    '*':{p:2,a:'L',f:(a,b)=>a*b},
    '/':{p:2,a:'L',f:(a,b)=>a/b},
    '%':{p:2,a:'L',f:(a,b)=>a%b},
    '^':{p:4,a:'R',f:(a,b)=>Math.pow(a,b)},
    'u-':{p:3,a:'R',unary:true,f:a=>-a},
    '!':{p:5,a:'L',unary:true,post:true,f:a=>FUNCS.fact(a)}
  };
  function tokenize(s){
    const t=[]; let i=0;
    while(i<s.length){
      const c=s[i];
      if(/\s/.test(c)){i++;continue;}
      if(/[0-9.]/.test(c)){let j=i;while(j<s.length&&/[0-9.eE+\-]/.test(s[j])){
        // handle scientific notation; only consume +/- if previous is e/E
        if((s[j]==='+'||s[j]==='-')&&!(s[j-1]==='e'||s[j-1]==='E'))break;
        j++;}
        t.push({t:'n',v:parseFloat(s.slice(i,j))});i=j;continue;}
      if(/[A-Za-z_]/.test(c)){let j=i;while(j<s.length&&/[A-Za-z0-9_]/.test(s[j]))j++;
        const w=s.slice(i,j); i=j;
        if(s[i]==='('){t.push({t:'f',v:w});}else{t.push({t:'v',v:w});}
        continue;}
      if(c==='('){t.push({t:'('});i++;continue;}
      if(c===')'){t.push({t:')'});i++;continue;}
      if(c===','){t.push({t:','});i++;continue;}
      if('+-*/^%!'.includes(c)){
        const prev=t[t.length-1];
        if(c==='-'&&(!prev||prev.t==='op'||prev.t==='('||prev.t===',')){t.push({t:'op',v:'u-'});}
        else if(c==='+'&&(!prev||prev.t==='op'||prev.t==='('||prev.t===',')){i++;continue;}
        else t.push({t:'op',v:c});
        i++;continue;
      }
      throw new Error('Unbekanntes Zeichen: '+c);
    }
    return t;
  }
  function toRPN(tokens){
    const out=[],st=[];
    for(const tk of tokens){
      if(tk.t==='n'||tk.t==='v')out.push(tk);
      else if(tk.t==='f')st.push(tk);
      else if(tk.t==='op'){
        const op=OPS[tk.v];
        while(st.length){
          const top=st[st.length-1];
          if(top.t==='f'){out.push(st.pop());continue;}
          if(top.t==='op'){
            const o2=OPS[top.v];
            if((op.a==='L'&&op.p<=o2.p)||(op.a==='R'&&op.p<o2.p)){out.push(st.pop());continue;}
          }
          break;
        }
        st.push(tk);
      } else if(tk.t==='('){st.push(tk);}
      else if(tk.t===')'){
        while(st.length&&st[st.length-1].t!=='(')out.push(st.pop());
        if(!st.length)throw new Error('Klammer fehlt');
        st.pop();
        if(st.length&&st[st.length-1].t==='f')out.push(st.pop());
      } else if(tk.t===','){
        while(st.length&&st[st.length-1].t!=='(')out.push(st.pop());
      }
    }
    while(st.length){const t=st.pop();if(t.t==='('||t.t===')')throw new Error('Klammern');out.push(t);}
    return out;
  }
  function evalRPN(rpn,vars,degMode){
    const st=[];
    for(const tk of rpn){
      if(tk.t==='n')st.push(tk.v);
      else if(tk.t==='v'){
        if(tk.v in CONSTS)st.push(CONSTS[tk.v]);
        else if(vars&&tk.v in vars)st.push(Number(vars[tk.v]));
        else throw new Error('Unbekannt: '+tk.v);
      } else if(tk.t==='op'){
        const o=OPS[tk.v];
        if(o.unary){const a=st.pop();st.push(o.f(a));}
        else{const b=st.pop(),a=st.pop();st.push(o.f(a,b));}
      } else if(tk.t==='f'){
        const fn=FUNCS[tk.v];
        if(!fn)throw new Error('Unbekannte Funktion: '+tk.v);
        // we assume unary except min/max/pow
        if(['min','max','pow'].includes(tk.v)){
          const b=st.pop(),a=st.pop();st.push(fn(a,b));
        } else {
          let a=st.pop();
          if(degMode&&['sin','cos','tan'].includes(tk.v))a=a*Math.PI/180;
          let r=fn(a);
          if(degMode&&['asin','acos','atan'].includes(tk.v))r=r*180/Math.PI;
          st.push(r);
        }
      }
    }
    if(st.length!==1)throw new Error('Ausdruck ungültig');
    return st[0];
  }
  window.mathEval = function(expr, vars, opts){
    opts=opts||{};
    const rpn=toRPN(tokenize(expr));
    return evalRPN(rpn, vars||{}, !!opts.deg);
  };
})();
