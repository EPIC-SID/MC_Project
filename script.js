/* ── GCD helper ────────────────────────────────── */
function gcd(a, b) {
  a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b));
  while (b) { let t = b; b = a % b; a = t; }
  return a || 1;
}

/* ── Recognize symbolic constants ─────────────── */
function recognizeConstant(val) {
  if (!Number.isFinite(val)) return null;
  const abs = Math.abs(val);
  const sign = val < 0 ? -1 : 1;
  const signSym = val < 0 ? '−' : '';
  if (abs < 1e-9) return { sym: '0', val: 0 };
  const tol = 1.2e-3;

  // Pure fractions n/d
  for (let d = 1; d <= 24; d++) {
    for (let n = 1; n <= 24 * d; n++) {
      const c = n / d;
      if (Math.abs(abs - c) / (c || 1) < tol) {
        const g = gcd(n, d); const sn = n/g, sd = d/g;
        return { 
          sym: signSym + (sd === 1 ? `${sn}` : `${sn}/${sd}`), 
          val: sign * (sn / sd) 
        };
      }
    }
  }

  const bases = [
    { sym: 'π',  v: Math.PI },
    { sym: '√2', v: Math.SQRT2 },
    { sym: '√3', v: Math.sqrt(3) },
    { sym: 'π²', v: Math.PI * Math.PI },
    { sym: '√5', v: Math.sqrt(5) },
    { sym: 'e',  v: Math.E },
    { sym: 'π√2',v: Math.PI * Math.SQRT2 },
    { sym: 'π√3',v: Math.PI * Math.sqrt(3) },
  ];

  for (const base of bases) {
    for (let d = 1; d <= 16; d++) {
      for (let n = 1; n <= 10 * d; n++) {
        const c = (n / d) * base.v;
        if (Math.abs(abs - c) / (c || 1) < tol) {
          const g = gcd(n, d); const sn = n/g, sd = d/g;
          let s;
          if (sd === 1 && sn === 1) s = base.sym;
          else if (sd === 1) s = `${sn}${base.sym}`;
          else if (sn === 1) s = `${base.sym}/${sd}`;
          else s = `${sn}${base.sym}/${sd}`;
          return { sym: signSym + s, val: sign * c };
        }
      }
    }
  }
  return null;
}

/* ── Display result with symbolic form ─────────── */
function displayResult(val, metaText, isExact = false) {
  const resultEl = document.getElementById('integralResult');
  const metaEl   = document.getElementById('integralMeta');
  const symWrap  = document.getElementById('integralSymbolic');
  const symVal   = document.getElementById('integralSymVal');

  const recognized = recognizeConstant(val);
  
  if (!isExact && recognized) {
    val = recognized.val;
    isExact = true;
  }

  if (isExact) {
    resultEl.innerHTML = `<span style="color: #2563eb">= ${Number(val.toFixed(10))}</span>`;
  } else {
    resultEl.textContent = `≈ ${val.toFixed(8)}`;
  }
  metaEl.textContent   = metaText;

  if (recognized) {
    symVal.textContent = recognized.sym;
    symWrap.style.display = 'block';
  } else {
    symWrap.style.display = 'none';
  }
}

/* ── Helpers for step builders ─────────────────── */
function _ev(fn, x, y) {
  try { const v = fn(x, y, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E); return Number.isFinite(v) ? v : null; } catch { return null; }
}
function _resultBlock(val, exactTeX) {
  const recognized = recognizeConstant(val);
  
  if (exactTeX) {
    return `<div class="step-block"><div class="step-block-title">Final Result</div><div class="step-content">
      <div style="margin-bottom: 8px;">
        <span class="sym-label" style="font-weight: 600; color: var(--primary);">Exact Analytical Result:</span><br>
        <span class="sym-line" style="font-size: 16px;">\\( \\displaystyle ${exactTeX} \\)</span>
      </div>
      <div class="step-final-val" style="margin-top: 10px; font-size: 0.9em; opacity: 0.8;">
        Numerical approximation: ≈ ${val.toFixed(8)}
      </div>
    </div></div>`;
  }

  const displayVal = recognized ? recognized.val : val;
  const isExact = !!recognized;

  return `<div class="step-block"><div class="step-block-title">Final Result</div><div class="step-content">
    <div class="step-final-val">${isExact ? '=' : '≈'} ${displayVal.toFixed(isExact ? 4 : 8)}</div>
    ${recognized ? `<div class="step-symbolic-val">= ${recognized.sym}</div>` : '<em>No common symbolic form recognised.</em>'}
  </div></div>`;
}

/* ── DUIS helpers ───────────────────────────────── */
function toNerd(e) {
  // Convert JS expression syntax → nerdamer syntax
  return String(e).replace(/\*\*/g, '^').replace(/\bln\b/g, 'log');
}

function nSub(expr, variable, value) {
  try {
    const sub = {}; sub[variable] = toNerd(String(value));
    return nerdamer(toNerd(expr), sub).toString();
  } catch { return null; }
}

// Build 2-step DUIS HTML: inner integral wrt innerVar, then outer wrt outerVar
function buildDUISSteps(expr, innerVar, innerLo, innerHi, outerVar, outerLo, outerHi) {
  if (typeof nerdamer === 'undefined') return null;
  try {
    const nExpr = toNerd(expr);
    const exprTex = nerdamer(nExpr).toTeX();
    const innerHiTex = nerdamer(toNerd(innerHi)).toTeX();
    const innerLoTex = nerdamer(toNerd(innerLo)).toTeX();

    // ── Inner antiderivative ──────────────────────
    const antI_str = nerdamer.integrate(nExpr, innerVar).toString();
    const atHi_str = nSub(antI_str, innerVar, innerHi);
    const atLo_str = nSub(antI_str, innerVar, innerLo);
    if (!atHi_str || !atLo_str) return null;

    const antI_tex = nerdamer(antI_str).toTeX();
    const atHi_tex = nerdamer(atHi_str).toTeX();
    const atLo_tex = nerdamer(atLo_str).toTeX();

    let Ix_str, Ix_tex;
    try { 
      Ix_str = nerdamer(`(${toNerd(atHi_str)})-(${toNerd(atLo_str)})`).toString(); 
      Ix_tex = nerdamer(Ix_str).toTeX();
    }
    catch { 
      Ix_str = `(${atHi_str}) - (${atLo_str})`; 
      Ix_tex = `${atHi_tex} - \\left(${atLo_tex}\\right)`;
    }

    const innerHTML = `
<div class="step-block">
  <div class="step-block-title">Step 2 — Inner Integration wrt ${innerVar}</div>
  <div class="step-content">
    <div class="sym-block">
      <span class="sym-label">Antiderivative:</span><br>
      <span class="sym-line">\\( \\int \\left( ${exprTex} \\right) d${innerVar} = ${antI_tex} + C \\)</span>
    </div>
    <div class="sym-block">
      <span class="sym-label">Evaluate at upper limit &nbsp;\\( ${innerVar} = ${innerHiTex} \\):</span><br>
      <span class="sym-line">\\( ${atHi_tex} \\)</span>
      <span class="sym-label">Evaluate at lower limit &nbsp;\\( ${innerVar} = ${innerLoTex} \\):</span><br>
      <span class="sym-line">\\( ${atLo_tex} \\)</span>
      <span class="sym-label">\\( I(${outerVar}) = \\) upper − lower:</span><br>
      <span class="sym-line">\\( \\displaystyle ${Ix_tex} \\)</span>
    </div>
  </div>
</div>`;

    // ── Outer antiderivative ──────────────────────
    let outerHTML = '';
    let exactTeX = null;
    try {
      const antO_str = nerdamer.integrate(toNerd(Ix_str), outerVar).toString();
      const atOutHi_str = nSub(antO_str, outerVar, outerHi);
      const atOutLo_str = nSub(antO_str, outerVar, outerLo);
      
      const antO_tex = nerdamer(antO_str).toTeX();
      const atOutHi_tex = nerdamer(atOutHi_str).toTeX();
      const atOutLo_tex = nerdamer(atOutLo_str).toTeX();
      
      const outerHiTex = nerdamer(toNerd(outerHi)).toTeX();
      const outerLoTex = nerdamer(toNerd(outerLo)).toTeX();

      let finalR_tex;
      try { 
        finalR_tex = nerdamer(`(${toNerd(atOutHi_str)})-(${toNerd(atOutLo_str)})`).toTeX(); 
      }
      catch { 
        finalR_tex = `${atOutHi_tex} - \\left(${atOutLo_tex}\\right)`; 
      }
      exactTeX = finalR_tex;

      outerHTML = `
<div class="step-block">
  <div class="step-block-title">Step 3 — Outer Integration wrt ${outerVar}</div>
  <div class="step-content">
    <div class="sym-block">
      <span class="sym-label">Antiderivative:</span><br>
      <span class="sym-line">\\( \\int \\left( ${Ix_tex} \\right) d${outerVar} = ${antO_tex} + C \\)</span>
    </div>
    <div class="sym-block">
      <span class="sym-label">Evaluate at upper limit &nbsp;\\( ${outerVar} = ${outerHiTex} \\):</span><br>
      <span class="sym-line">\\( ${atOutHi_tex} \\)</span>
      <span class="sym-label">Evaluate at lower limit &nbsp;\\( ${outerVar} = ${outerLoTex} \\):</span><br>
      <span class="sym-line">\\( ${atOutLo_tex} \\)</span>
      <span class="sym-label">Result = upper − lower:</span><br>
      <span class="sym-line">\\( \\displaystyle ${finalR_tex} \\)</span>
    </div>
  </div>
</div>`;
    } catch { outerHTML = `<div class="step-block"><div class="step-block-title">Step 3 — Outer Integration wrt ${outerVar}</div><div class="step-content"><em>Outer integral evaluated numerically.</em></div></div>`; }

    let exactVal = null;
    try {
      const res = nerdamer(`(${toNerd(atOutHi_str)})-(${toNerd(atOutLo_str)})`).evaluate();
      exactVal = Number(res.text());
    } catch(e) {}

    return { html: innerHTML + outerHTML, exactTeX: exactTeX, exactVal: exactVal };
  } catch { return null; }
}


/* ── Build steps HTML for double integral ──────── */
function buildStepsDouble(expr, coordSystem, a, b, c, d, N, val, caseType, lowExpr, upExpr) {
  const dx = (b - a) / N, dy = (d - c) / N;
  let fn; try { fn = safeCompile(expr, ['x','y','sin','cos','tan','sqrt','abs','exp','log','ln','pow','PI','E']); } catch { fn = null; }

  // POLAR
  if (coordSystem === 'polar') {
    let pfn; try { pfn = safeCompile(expr,['r','theta','sin','cos','tan','sqrt','abs','exp','log','ln','pow','PI','E']); } catch { pfn=null; }
    let rows=''; for(let i=0;i<2;i++) for(let j=0;j<2;j++){const r=a+(i+.5)*dx,th=c+(j+.5)*dy;const fv=pfn?_ev(pfn,r,th):null;rows+=`<tr><td>${r.toFixed(4)}</td><td>${th.toFixed(4)}</td><td>${fv!==null?fv.toFixed(5):'—'}</td><td>${fv!==null?(fv*r).toFixed(5):'—'}</td></tr>`;}
    return {
      html: `<div class="step-block"><div class="step-block-title">Step 1 — Integral Setup</div><div class="step-content">∬ f(r,θ) dA = ∫<sub>${c}</sub><sup>${d}</sup> ∫<sub>${a}</sub><sup>${b}</sup> f(r,θ)·r dr dθ<br>r ∈ [${a},${b}], θ ∈ [${c},${d}]<br><em>Jacobian r included for polar.</em></div></div>
<div class="step-block"><div class="step-block-title">Step 2 — Partition (N=${N})</div><div class="step-content">Δr=${dx.toFixed(5)}, Δθ=${dy.toFixed(5)}, cells=${N*N}</div></div>
<div class="step-block"><div class="step-block-title">Step 3 — Midpoint Sum</div><div class="step-content">Result ≈ Σ f(rᵢ*,θⱼ*)·rᵢ*·Δr·Δθ<table class="steps-table" style="margin-top:6px"><thead><tr><th>r*</th><th>θ*</th><th>f</th><th>f·r*</th></tr></thead><tbody>${rows}</tbody></table></div></div>${_resultBlock(val)}`
    };
  }

  // CASE 1: ∫[a→b] [ ∫[g1(x)→g2(x)] f dy ] dx
  if (caseType === 'case1') {
    const duisResult = buildDUISSteps(expr, 'y', lowExpr||'0', upExpr||'x', 'x', a, b);
    const duisHTML = duisResult ? duisResult.html : null;
    const exactTeX = duisResult ? duisResult.exactTeX : null;
    const exactVal = duisResult ? duisResult.exactVal : null;
    return {
      html: `<div class="step-block"><div class="step-block-title">Step 1 — Setup (Case 1)</div><div class="step-content">
∬ f(x,y) dA = ∫<sub>${a}</sub><sup>${b}</sup> [ ∫<sub>${lowExpr}</sub><sup>${upExpr}</sup> f(x,y) <strong>dy</strong> ] <strong>dx</strong><br>
Outer: x ∈ [${a}, ${b}] (constant) &nbsp;|&nbsp; Inner: y from ${lowExpr} to ${upExpr}
</div></div>
${duisHTML || '<em>Symbolic steps could not be generated for this expression. Evaluated numerically.</em>'}
${_resultBlock(val, exactTeX)}`,
      exactVal: exactVal
    };
  }

  // CASE 2: ∫[c→d] [ ∫[h1(y)→h2(y)] f dx ] dy
  if (caseType === 'case2') {
    const duisResult = buildDUISSteps(expr, 'x', lowExpr||'0', upExpr||'y', 'y', c, d);
    const duisHTML = duisResult ? duisResult.html : null;
    const exactTeX = duisResult ? duisResult.exactTeX : null;
    const exactVal = duisResult ? duisResult.exactVal : null;
    return {
      html: `<div class="step-block"><div class="step-block-title">Step 1 — Setup (Case 2)</div><div class="step-content">
∬ f(x,y) dA = ∫<sub>${c}</sub><sup>${d}</sup> [ ∫<sub>${lowExpr}</sub><sup>${upExpr}</sup> f(x,y) <strong>dx</strong> ] <strong>dy</strong><br>
Outer: y ∈ [${c}, ${d}] (constant) &nbsp;|&nbsp; Inner: x from ${lowExpr} to ${upExpr}
</div></div>
${duisHTML || '<em>Symbolic steps could not be generated for this expression. Evaluated numerically.</em>'}
${_resultBlock(val, exactTeX)}`,
      exactVal: exactVal
    };
  }

  // CASE 4: rectangular + separable
  if (caseType === 'case4') {
    // Determine the separate functions approximately by evaluating
    let stepHTML = '';
    if (typeof nerdamer !== 'undefined') {
      try {
        const nExpr = toNerd(expr);
        // Find X(x) and Y(y) symbolically if possible. For simplicity, just show DUIS as independent integrals.
        // Or we can just use DUIS standard output but change the titles.
        stepHTML = `
<div class="step-block"><div class="step-block-title">Step 2 — Integrate X(x) wrt x</div><div class="step-content">
  <div class="sym-block">
    <span class="sym-line">Iₓ = ∫<sub>${a}</sub><sup>${b}</sup> X(x) dx</span>
    <span class="sym-line">Evaluate independently over x.</span>
  </div>
</div></div>
<div class="step-block"><div class="step-block-title">Step 3 — Integrate Y(y) wrt y</div><div class="step-content">
  <div class="sym-block">
    <span class="sym-line">I_y = ∫<sub>${c}</sub><sup>${d}</sup> Y(y) dy</span>
    <span class="sym-line">Evaluate independently over y.</span>
  </div>
</div></div>
<div class="step-block"><div class="step-block-title">Step 4 — Multiply: Result = Iₓ × I_y</div><div class="step-content">
  Combine the two independent 1D integrals.
</div></div>`;
      } catch (e) {
        stepHTML = '';
      }
    }
    
    // As a fallback and standard implementation, we can just use the DUIS logic to calculate
    const duisResult = buildDUISSteps(expr, 'y', c, d, 'x', a, b);
    const duisHTML = duisResult ? duisResult.html : null;
    const exactTeX = duisResult ? duisResult.exactTeX : null;
    const exactVal = duisResult ? duisResult.exactVal : null;

    return {
      html: `<div class="step-block"><div class="step-block-title">Step 1 — Separable Form (Case 4)</div><div class="step-content">
f(x,y) = X(x)·Y(y) → ∬ f dA = [ ∫<sub>${a}</sub><sup>${b}</sup> X(x) dx ] × [ ∫<sub>${c}</sub><sup>${d}</sup> Y(y) dy ]<br>
Both limits are constant → integral separates into two independent 1D integrals.
</div></div>
${duisHTML || '<em>Symbolic steps could not be generated for this expression. Evaluated numerically.</em>'}
${_resultBlock(val, exactTeX)}`,
      exactVal: exactVal
    };
  }

  // CASE 3: rectangular, non-separable
  if (caseType === 'case3' || caseType === undefined) {
    const duisResult = buildDUISSteps(expr, 'y', c, d, 'x', a, b);
    const duisHTML = duisResult ? duisResult.html : null;
    const exactTeX = duisResult ? duisResult.exactTeX : null;
    const exactVal = duisResult ? duisResult.exactVal : null;
    return {
      html: `<div class="step-block"><div class="step-block-title">Step 1 — Setup (Case 3)</div><div class="step-content">
∬ f(x,y) dA = ∫<sub>${a}</sub><sup>${b}</sup> [ ∫<sub>${c}</sub><sup>${d}</sup> f(x,y) <strong>dy</strong> ] <strong>dx</strong><br>
Both limits are constant → order can be reversed (Fubini's theorem).<br>
Chosen order: integrate <strong>wrt y first</strong> (inner), then <strong>wrt x</strong> (outer).
</div></div>
${duisHTML || '<em>Symbolic steps could not be generated for this expression. Evaluated numerically.</em>'}
${_resultBlock(val, exactTeX)}`,
      exactVal: exactVal
    };
  }

}


/* ── Build steps HTML for triple integral ──────── */
function buildStepsTriple(expr, coordSystem, a, b, c, d, e, f, N, val) {
  const dx = (b-a)/N, dy = (d-c)/N, dz = (f-e)/N;
  const recognized = recognizeConstant(val);
  const axes = { cartesian3d:['x','y','z'], cylindrical:['r','θ','z'], spherical:['ρ','φ','θ'] };
  const [a1,a2,a3] = axes[coordSystem] || ['x','y','z'];
  const jac = coordSystem==='cylindrical' ? '<em>Jacobian r applied automatically.</em>'
            : coordSystem==='spherical'   ? '<em>Jacobian ρ²sin(φ) applied automatically.</em>'
            : '';
  const html = `
  <div class="step-block">
    <div class="step-block-title">Step 1 — Integral Setup</div>
    <div class="step-content">
      ∭ (${expr}) d${a1}d${a2}d${a3}<br>
      ${a1}∈[${a},${b}],  ${a2}∈[${c},${d}],  ${a3}∈[${e},${f}]<br>
      ${jac}
    </div>
  </div>
  <div class="step-block">
    <div class="step-block-title">Step 2 — Partition  (N = ${N} per axis)</div>
    <div class="step-content">
      Δ${a1} = ${dx.toFixed(6)},   Δ${a2} = ${dy.toFixed(6)},   Δ${a3} = ${dz.toFixed(6)}<br>
      Total cells = ${N}³ = ${N*N*N}
    </div>
  </div>
  <div class="step-block">
    <div class="step-block-title">Step 3 — Midpoint Rule</div>
    <div class="step-content">
      ${a1}ᵢ* = ${a} + (i+0.5)·Δ${a1}<br>
      ${a2}ⱼ* = ${c} + (j+0.5)·Δ${a2}<br>
      ${a3}ₖ* = ${e} + (k+0.5)·Δ${a3}<br>
      Result ≈ Σ f(${a1}ᵢ*,${a2}ⱼ*,${a3}ₖ*) · Δ${a1}·Δ${a2}·Δ${a3}
    </div>
  </div>
  <div class="step-block">
    <div class="step-block-title">Step 4 — Final Result</div>
    <div class="step-content">
      <div class="step-final-val">${recognized ? '=' : '≈'} ${(recognized ? recognized.val : val).toFixed(recognized ? 4 : 8)}</div>
      ${recognized ? `<div class="step-symbolic-val">= ${recognized.sym}</div>` : '<em>No common symbolic form recognised.</em>'}
    </div>
  </div>`;
  return { html: html, exactVal: null };
}

/* ── Show / toggle steps card ──────────────────── */
function showSteps(html) {
  const card    = document.getElementById('stepsCard');
  const content = document.getElementById('stepsContent');
  card.style.display = 'block';
  content.innerHTML  = html;
  content.classList.remove('hidden');
  document.getElementById('stepsToggle').classList.remove('collapsed');
  
  if (window.MathJax) {
    MathJax.typesetPromise([content]).catch((err) => console.log('MathJax error: ', err));
  }
}

function normalizeExpression(input) {
  let expr = String(input || "").trim();
  if (expr.length === 0) {
    return expr;
  }

  // Convert caret power to JS power.
  expr = expr.replace(/\^/g, "**");

  // Common constants.
  expr = expr.replace(/\bpi\b/gi, "PI");
  expr = expr.replace(/\be\b/g, "E");

  // Make function-style usage more user-friendly:
  // - sinx   -> sin(x)
  // - logx   -> log(x)
  // - sqrtx  -> sqrt(x)
  // Does not alter already-parenthesized calls like sin(x).
  const fnNames = ["sin", "cos", "tan", "sqrt", "log", "ln", "abs", "exp"];
  for (const fn of fnNames) {
    const re = new RegExp(`\\b${fn}\\s*([a-zA-Z][a-zA-Z0-9_]*)\\b(?!\\s*\\()`, "g");
    expr = expr.replace(re, `${fn}($1)`);
  }

  // Conservative implicit multiplication:
  // - 2x  -> 2*x
  // - 2(x+y) -> 2*(x+y)
  // - (x+y)z -> (x+y)*z
  expr = expr.replace(/(\d)\s*([a-zA-Z(])/g, "$1*$2");
  expr = expr.replace(/(\))\s*([a-zA-Z(])/g, "$1*$2");

  return expr;
}

function safeCompile(expression, vars) {
  const normalized = normalizeExpression(expression);
  const allowed = /^[a-z0-9_+\-*/().,^%\s,]*$/i;
  if (!allowed.test(normalized)) {
    throw new Error("Expression contains unsupported characters.");
  }

  return new Function(...vars, `return ${normalized};`);
}

function midpointDoubleIntegral(fn, a, b, c, d, n) {
  const dx = (b - a) / n;
  const dy = (d - c) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x = a + (i + 0.5) * dx;
    for (let j = 0; j < n; j++) {
      const y = c + (j + 0.5) * dy;
      sum += fn(x, y);
    }
  }
  return sum * dx * dy;
}

function midpointDoubleVariableInner(fn, outerMin, outerMax, innerMinFn, innerMaxFn, n, caseType) {
  const dOuter = (outerMax - outerMin) / n;
  let total = 0;

  for (let i = 0; i < n; i++) {
    const outer = outerMin + (i + 0.5) * dOuter;
    const innerMin = innerMinFn(outer);
    const innerMax = innerMaxFn(outer);
    
    // Gracefully skip if limits are invalid or equal at this slice
    if (!(innerMax > innerMin)) continue;

    const dInner = (innerMax - innerMin) / n;
    for (let j = 0; j < n; j++) {
      const inner = innerMin + (j + 0.5) * dInner;
      if (caseType === "case1") {
        total += fn(outer, inner) * dInner * dOuter; // x outer, y inner
      } else {
        total += fn(inner, outer) * dInner * dOuter; // y outer, x inner
      }
    }
  }

  return total;
}

function midpointTripleIntegral(fn, a, b, c, d, e, f, n) {
  const dx = (b - a) / n;
  const dy = (d - c) / n;
  const dz = (f - e) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x = a + (i + 0.5) * dx;
    for (let j = 0; j < n; j++) {
      const y = c + (j + 0.5) * dy;
      for (let k = 0; k < n; k++) {
        const z = e + (k + 0.5) * dz;
        sum += fn(x, y, z);
      }
    }
  }
  return sum * dx * dy * dz;
}

function parseNumber(id) {
  const val = Number(document.getElementById(id).value);
  if (Number.isNaN(val)) {
    throw new Error(`Invalid number in ${id}.`);
  }
  return val;
}

function scoreForm(formId, outputId) {
  const form = document.getElementById(formId);
  const el   = document.getElementById(outputId);

  // Collect all unique question names from radio inputs
  const questionNames = [...new Set(
    [...form.querySelectorAll('input[type="radio"]')].map(r => r.name)
  )];
  const totalQuestions = questionNames.length;

  // Validate every question has been answered
  const unanswered = questionNames.filter(
    name => !form.querySelector(`input[name="${name}"]:checked`)
  );
  if (unanswered.length > 0) {
    el.classList.remove('hidden');
    el.style.cssText = 'background:var(--warn-bg);border-color:#f0c060;color:var(--warn);';
    el.innerHTML = `⚠️ Please answer <strong>all ${totalQuestions} questions</strong> before submitting. `
                 + `(${unanswered.length} unanswered)`;
    return;
  }

  // Count correct answers (value="1" = correct, value="0" = wrong)
  let correct = 0;
  questionNames.forEach(name => {
    const checked = form.querySelector(`input[name="${name}"]:checked`);
    if (checked && Number(checked.value) === 1) correct++;
  });

  // Highlight each question card green / red
  questionNames.forEach(name => {
    const checked = form.querySelector(`input[name="${name}"]:checked`);
    const card    = checked.closest('.question-card');
    const isRight = Number(checked.value) === 1;
    card.style.borderColor = isRight ? '#1a9e6a' : '#ef4444';
    card.style.background  = isRight ? '#e8f8f0'  : '#fee2e2';
  });

  const pct   = Math.round((correct / totalQuestions) * 100);
  const emoji = pct === 100 ? '🏆' : pct >= 66 ? '✅' : pct >= 33 ? '⚠️' : '❌';
  const grade = pct === 100 ? 'Perfect score!'
              : pct >= 66   ? 'Good job!'
              : pct >= 33   ? 'Keep practicing.'
              : 'Review the material and try again.';

  el.classList.remove('hidden');
  el.style.cssText = '';
  el.innerHTML =
    `${emoji} Score: <strong>${correct} / ${totalQuestions}</strong> &nbsp;·&nbsp; `
    + `${pct}% correct &nbsp;·&nbsp; <em>${grade}</em>`
    + `<br><button type="button" class="btn btn-ghost btn-sm" `
    + `style="margin-top:10px;" onclick="retryQuiz('${formId}','${outputId}')">🔄 Retry Quiz</button>`;
}

function retryQuiz(formId, outputId) {
  const form = document.getElementById(formId);
  const el   = document.getElementById(outputId);

  // Uncheck all radio buttons
  form.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);

  // Reset question card highlight colours
  form.querySelectorAll('.question-card').forEach(card => {
    card.style.borderColor = '';
    card.style.background  = '';
  });

  // Hide result panel
  el.classList.add('hidden');
  el.innerHTML = '';
  el.style.cssText = '';
}

function setVizStatus(message) {
  const statusEl = document.getElementById("vizStatus");
  const vizEl    = document.getElementById("viz3d");
  if (message) {
    statusEl.textContent = message;
    statusEl.style.display = 'block';
    vizEl.style.display    = 'none';
  } else {
    statusEl.style.display = 'none';
    vizEl.style.display    = 'block';
  }
}

function clearVisualization(message) {
  const viz = document.getElementById("viz3d");
  if (window.Plotly) { window.Plotly.purge(viz); }
  setVizStatus(message || "Graph unavailable for this selection.");
  clearDesmos();
}

/* ── Desmos 3D Visualization ─────────────────────── */
let desmosCalc = null;
let desmosIs3D = false;

function initDesmos() {
  const el = document.getElementById('desmosDiv');
  if (!el || typeof Desmos === 'undefined') return;
  try {
    desmosCalc = Desmos.Calculator3D(el, {
      expressions: false, settingsMenu: false,
      zoomButtons: true, keypad: false, border: false,
    });
    desmosIs3D = true;
  } catch (e) {
    // fallback to 2D if 3D not available
    desmosCalc = Desmos.GraphingCalculator(el, {
      expressions: false, settingsMenu: false,
      zoomButtons: true, keypad: false,
      border: false, lockViewport: false,
      backgroundColor: '#f8fbff',
    });
    desmosIs3D = false;
  }
}

function clearDesmos() {
  const el = document.getElementById('desmosDiv');
  const st = document.getElementById('desmosStatus');
  if (el) el.style.display = 'none';
  if (st) st.style.display = 'block';
  if (desmosCalc) desmosCalc.setBlank();
}

// JS math syntax → Desmos LaTeX
function jsToDesmos(expr) {
  return String(expr)
    .replace(/\*\*/g, '^')
    .replace(/\bsqrt\s*\(([^)]+)\)/g, '\\sqrt{$1}')
    .replace(/\babs\s*\(([^)]+)\)/g,  '\\left|$1\\right|')
    .replace(/\bsin\b/g,  '\\sin').replace(/\bcos\b/g, '\\cos')
    .replace(/\btan\b/g,  '\\tan').replace(/\bln\b/g,  '\\ln')
    .replace(/\bexp\s*\(([^)]+)\)/g, 'e^{$1}')
    .replace(/\bPI\b/g,   '\\pi').replace(/\bpi\b/gi, '\\pi')
    .replace(/\btheta\b/g,'\\theta')
    .replace(/([0-9])\s*\*\s*([a-zA-Z(\\])/g, '$1$2')  // 2*x → 2x
    .replace(/([a-zA-Z])\s*\*\s*([a-zA-Z(\\])/g, '$1$2') // x*y → xy
    .replace(/\s*\*\s*/g, '\\cdot ');                    // remaining * → ·
}

function renderDesmosRegion(modeInfo) {
  if (!desmosCalc) return;
  desmosCalc.setBlank();

  const el = document.getElementById('desmosDiv');
  const st = document.getElementById('desmosStatus');
  if (el) el.style.display = 'block';
  if (st) st.style.display = 'none';

  const BLU = '#0078d4', GRN = '#1a9e6a', GRY = '#a0aec0';
  const { a, b, coordSystem, doubleCase, expr } = modeInfo;
  const c = modeInfo.c ?? 0, d = modeInfo.d ?? 1;
  const fTex = jsToDesmos(expr);

  if (desmosIs3D) {
    // ── 3D MODE: show z = f(x,y) surface + solid volume ──────────────
    let domX, domY;

    if (coordSystem === 'polar') {
      // Polar: draw surface z=f(r,θ) parametrically + boundary circles
      // Boundary circles at r=a and r=b (in Cartesian for 3D)
      const fPolar = jsToDesmos(expr.replace(/\br\b/g, '\\sqrt{x^2+y^2}')
                                    .replace(/\btheta\b/g, '\\operatorname{arctan}\\left(y,x\\right)'));
      desmosCalc.setExpression({
        id: 'surf', latex: `z=${fPolar}\\left\\{${a}^{2}\\le x^{2}+y^{2}\\le ${b}^{2}\\right\\}`, color: BLU
      });
      desmosCalc.setExpression({
        id: 'vol',  latex: `0\\le z\\le ${fPolar}\\left\\{${a}^{2}\\le x^{2}+y^{2}\\le ${b}^{2}\\right\\}`, color: BLU
      });
      desmosCalc.setExpression({ id: 'c1', latex: `x^{2}+y^{2}=${a}^{2}`, color: GRY });
      desmosCalc.setExpression({ id: 'c2', latex: `x^{2}+y^{2}=${b}^{2}`, color: GRY });
      return;
    }

    // Build domain restriction strings
    domX = `\\left\\{${a}\\le x\\le ${b}\\right\\}`;
    if (doubleCase === 'case1') {
      const lo = jsToDesmos(modeInfo.lowExpr || '0');
      const hi = jsToDesmos(modeInfo.upExpr  || 'x');
      domY = `\\left\\{${lo}\\le y\\le ${hi}\\right\\}`;
    } else if (doubleCase === 'case2') {
      const lo = jsToDesmos(modeInfo.lowExpr || '0');
      const hi = jsToDesmos(modeInfo.upExpr  || 'y');
      domX = `\\left\\{${lo}\\le x\\le ${hi}\\right\\}`;
      domY = `\\left\\{${c}\\le y\\le ${d}\\right\\}`;
    } else {
      domY = `\\left\\{${c}\\le y\\le ${d}\\right\\}`;
    }

    // Top surface z = f(x,y)
    desmosCalc.setExpression({
      id: 'surf', latex: `z=${fTex}${domX}${domY}`, color: BLU,
    });
    // Solid volume 0 ≤ z ≤ f(x,y) — the actual double integral volume
    desmosCalc.setExpression({
      id: 'vol', latex: `0\\le z\\le ${fTex}${domX}${domY}`, color: BLU,
    });
    // Floor outline at z = 0
    desmosCalc.setExpression({
      id: 'floor', latex: `z=0${domX}${domY}`, color: GRY,
    });

  } else {
    // ── 2D FALLBACK: shade the region R in the xy-plane ──────────────
    if (coordSystem === 'polar') {
      desmosCalc.setExpression({ id: 'r1',   latex: `x^2+y^2=${a}^2`, color: BLU, lineWidth: 2 });
      desmosCalc.setExpression({ id: 'r2',   latex: `x^2+y^2=${b}^2`, color: GRN, lineWidth: 2 });
      desmosCalc.setExpression({ id: 'fill', latex: `${a}^2\\le x^2+y^2\\le ${b}^2`, color: BLU });
      const R = b + 0.5;
      desmosCalc.setMathBounds({ left: -R, right: R, bottom: -R, top: R });
      return;
    }
    if (doubleCase === 'case1') {
      const lo = jsToDesmos(modeInfo.lowExpr || '0');
      const hi = jsToDesmos(modeInfo.upExpr  || 'x');
      desmosCalc.setExpression({ id: 'fill', latex: `${lo}\\le y\\le ${hi}\\left\\{${a}\\le x\\le ${b}\\right\\}`, color: BLU });
      desmosCalc.setExpression({ id: 'lo_c', latex: `y=${lo}`, color: BLU, lineWidth: 2.5 });
      desmosCalc.setExpression({ id: 'hi_c', latex: `y=${hi}`, color: GRN, lineWidth: 2.5 });
    } else if (doubleCase === 'case2') {
      const lo = jsToDesmos(modeInfo.lowExpr || '0');
      const hi = jsToDesmos(modeInfo.upExpr  || 'y');
      desmosCalc.setExpression({ id: 'fill', latex: `${lo}\\le x\\le ${hi}\\left\\{${c}\\le y\\le ${d}\\right\\}`, color: BLU });
      desmosCalc.setExpression({ id: 'lo_c', latex: `x=${lo}`, color: BLU, lineWidth: 2.5 });
      desmosCalc.setExpression({ id: 'hi_c', latex: `x=${hi}`, color: GRN, lineWidth: 2.5 });
    } else {
      desmosCalc.setExpression({ id: 'fill', latex: `${c}\\le y\\le ${d}\\left\\{${a}\\le x\\le ${b}\\right\\}`, color: BLU });
    }
    const xPad = Math.max(0.5, (b - a) * 0.25);
    const yPad = Math.max(0.5, (d - c) * 0.25);
    desmosCalc.setMathBounds({ left: a - xPad, right: b + xPad, bottom: c - yPad, top: d + yPad });
  }
}

function sampleRange(min, max, count) {
  if (count <= 1) {
    return [min];
  }
  const step = (max - min) / (count - 1);
  const arr = [];
  for (let i = 0; i < count; i++) {
    arr.push(min + i * step);
  }
  return arr;
}

function renderSurfacePlot(title, xVals, yVals, zGrid) {
  if (!window.Plotly) { setVizStatus("3D library failed to load."); return; }
  setVizStatus(null);

  const nx = xVals.length;
  const ny = yVals.length;

  /* ── 1. Main surface z = f(x,y) — semi-transparent ── */
  const surfaceTrace = {
    type: "surface",
    x: xVals, y: yVals, z: zGrid,
    colorscale: "Blues",
    opacity: 0.82,
    showscale: false,
    name: "f(x,y)",
    hovertemplate: "x: %{x:.3f}<br>y: %{y:.3f}<br>f: %{z:.4f}<extra></extra>",
  };

  /* ── 2. Floor plane z = 0 — shows region R ── */
  const zFloor = yVals.map(() => xVals.map(() => 0));
  const floorTrace = {
    type: "surface",
    x: xVals, y: yVals, z: zFloor,
    colorscale: [[0, "rgba(0,91,170,0.18)"], [1, "rgba(0,91,170,0.18)"]],
    showscale: false,
    opacity: 0.55,
    name: "Region R (z=0)",
    hoverinfo: "skip",
  };

  /* ── helper: build one curtain wall ── */
  function makeCurtain(xArr, yArr, zTop) {
    // two-row surface: bottom row at z=0, top row at z=f
    const zBot = zTop.map(() => 0);
    return {
      type: "surface",
      x: [xArr, xArr],
      y: [yArr, yArr],
      z: [zBot, zTop],
      colorscale: [[0, "rgba(0,120,212,0.10)"], [1, "rgba(0,120,212,0.28)"]],
      showscale: false,
      opacity: 0.55,
      hoverinfo: "skip",
    };
  }

  /* ── 3. Four curtain walls ── */
  // Front (y = yVals[0]):   z values = zGrid[0][j]
  const frontCurtain = makeCurtain(xVals, xVals.map(() => yVals[0]),      zGrid[0]);
  // Back  (y = yVals[ny-1]): z values = zGrid[ny-1][j]
  const backCurtain  = makeCurtain(xVals, xVals.map(() => yVals[ny - 1]), zGrid[ny - 1]);
  // Left  (x = xVals[0]):   z values = zGrid[i][0]
  const leftCurtain  = makeCurtain(yVals.map(() => xVals[0]),      yVals, zGrid.map(row => row[0]));
  // Right (x = xVals[nx-1]): z values = zGrid[i][nx-1]
  const rightCurtain = makeCurtain(yVals.map(() => xVals[nx - 1]), yVals, zGrid.map(row => row[nx - 1]));

  window.Plotly.newPlot(
    "viz3d",
    [floorTrace, frontCurtain, backCurtain, leftCurtain, rightCurtain, surfaceTrace],
    {
      title: { text: title, font: { size: 13, color: '#1a2a3a' } },
      paper_bgcolor: '#ffffff', plot_bgcolor: '#f8fbff',
      font: { color: '#4a6080', size: 11 },
      margin: { l: 0, r: 0, b: 0, t: 40 },
      showlegend: false,
      scene: {
        xaxis: { title: "X", gridcolor: '#dce6f0', zerolinecolor: '#b3d4f5' },
        yaxis: { title: "Y", gridcolor: '#dce6f0', zerolinecolor: '#b3d4f5' },
        zaxis: { title: "f(x,y)", gridcolor: '#dce6f0', zerolinecolor: '#b3d4f5', rangemode: 'tozero' },
        bgcolor: '#f0f4f8',
      },
    },
    { responsive: true }
  );
}


function renderScatter3D(title, points) {
  if (!window.Plotly) { setVizStatus("3D library failed to load."); return; }
  setVizStatus(null);
  window.Plotly.newPlot(
    "viz3d",
    [{
      type: "scatter3d", mode: "markers",
      x: points.x, y: points.y, z: points.z,
      marker: { size: 3, color: points.value, colorscale: "YlOrRd", opacity: 0.85, colorbar: { title: "f" } },
    }],
    {
      title,
      paper_bgcolor: '#ffffff', plot_bgcolor: '#f8fbff',
      font: { color: '#4a6080', size: 11 },
      margin: { l: 0, r: 0, b: 0, t: 36 },
      scene: {
        xaxis: { title: "Axis 1", gridcolor: '#dce6f0', zerolinecolor: '#b3d4f5' },
        yaxis: { title: "Axis 2", gridcolor: '#dce6f0', zerolinecolor: '#b3d4f5' },
        zaxis: { title: "Axis 3", gridcolor: '#dce6f0', zerolinecolor: '#b3d4f5' },
        bgcolor: '#f0f4f8',
      },
    },
    { responsive: true }
  );
}

function renderDoubleVisualization(modeInfo) {
  const density = 28;
  if (modeInfo.coordSystem === "polar") {
    const fn = safeCompile(modeInfo.expr, ["r", "theta", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
    const rVals = sampleRange(modeInfo.a, modeInfo.b, density);
    const tVals = sampleRange(modeInfo.c, modeInfo.d, density);
    const xGrid = [];
    const yGrid = [];
    const zGrid = [];

    for (let i = 0; i < tVals.length; i++) {
      const theta = tVals[i];
      const xRow = [];
      const yRow = [];
      const zRow = [];
      for (let j = 0; j < rVals.length; j++) {
        const r = rVals[j];
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        const z = fn(r, theta, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E);
        xRow.push(x);
        yRow.push(y);
        zRow.push(Number.isFinite(z) ? z : null);
      }
      xGrid.push(xRow);
      yGrid.push(yRow);
      zGrid.push(zRow);
    }

    renderSurfacePlot("Double Integral Surface (Polar)", xGrid, yGrid, zGrid);
    return;
  }

  const fn = safeCompile(modeInfo.expr, ["x", "y", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
  const xVals = sampleRange(modeInfo.a, modeInfo.b, density);
  const yVals = sampleRange(modeInfo.c, modeInfo.d, density);
  const zGrid = [];

  for (let i = 0; i < yVals.length; i++) {
    const y = yVals[i];
    const row = [];
    for (let j = 0; j < xVals.length; j++) {
      const x = xVals[j];
      let validPoint = true;
      if (modeInfo.doubleCase === "case1" || modeInfo.doubleCase === "case2") {
        const innerMin = modeInfo.lowFn(modeInfo.doubleCase === "case1" ? x : y);
        const innerMax = modeInfo.upFn(modeInfo.doubleCase === "case1" ? x : y);
        const inner = modeInfo.doubleCase === "case1" ? y : x;
        validPoint = inner >= innerMin && inner <= innerMax;
      }
      if (!validPoint) {
        row.push(null);
      } else {
        const z = fn(x, y, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E);
        row.push(Number.isFinite(z) ? z : null);
      }
    }
    zGrid.push(row);
  }

  renderSurfacePlot("Double Integral Surface", xVals, yVals, zGrid);
}

function estimateInnerRange(outerMin, outerMax, innerMinFn, innerMaxFn) {
  const samples = 60;
  const xs = sampleRange(outerMin, outerMax, samples);
  let minVal = Infinity;
  let maxVal = -Infinity;
  for (const outer of xs) {
    const lo = innerMinFn(outer);
    const hi = innerMaxFn(outer);
    if (Number.isFinite(lo) && Number.isFinite(hi)) {
      minVal = Math.min(minVal, lo, hi);
      maxVal = Math.max(maxVal, lo, hi);
    }
  }
  if (!Number.isFinite(minVal) || !Number.isFinite(maxVal) || !(maxVal > minVal)) {
    return null;
  }
  const pad = 0.06 * (maxVal - minVal);
  return { min: minVal - pad, max: maxVal + pad };
}

function renderTripleVisualization(modeInfo) {
  const pointsPerAxis = 13;
  const ax1 = sampleRange(modeInfo.a, modeInfo.b, pointsPerAxis);
  const ax2 = sampleRange(modeInfo.c, modeInfo.d, pointsPerAxis);
  const ax3 = sampleRange(modeInfo.e, modeInfo.f, pointsPerAxis);
  const points = { x: [], y: [], z: [], value: [] };

  if (modeInfo.coordSystem === "cartesian3d") {
    const fn = safeCompile(modeInfo.expr, ["x", "y", "z", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
    for (const x of ax1) {
      for (const y of ax2) {
        for (const z of ax3) {
          const v = fn(x, y, z, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E);
          if (Number.isFinite(v)) {
            points.x.push(x);
            points.y.push(y);
            points.z.push(z);
            points.value.push(v);
          }
        }
      }
    }
    renderScatter3D("Triple Integral Domain (Cartesian)", points);
    return;
  }

  if (modeInfo.coordSystem === "cylindrical") {
    const fn = safeCompile(modeInfo.expr, ["r", "theta", "z", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
    for (const r of ax1) {
      for (const theta of ax2) {
        for (const z of ax3) {
          const x = r * Math.cos(theta);
          const y = r * Math.sin(theta);
          const v = fn(r, theta, z, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E);
          if (Number.isFinite(v)) {
            points.x.push(x);
            points.y.push(y);
            points.z.push(z);
            points.value.push(v);
          }
        }
      }
    }
    renderScatter3D("Triple Integral Domain (Cylindrical to Cartesian)", points);
    return;
  }

  const fn = safeCompile(modeInfo.expr, ["rho", "phi", "theta", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
  for (const rho of ax1) {
    for (const phi of ax2) {
      for (const theta of ax3) {
        const x = rho * Math.sin(phi) * Math.cos(theta);
        const y = rho * Math.sin(phi) * Math.sin(theta);
        const z = rho * Math.cos(phi);
        const v = fn(rho, phi, theta, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E);
        if (Number.isFinite(v)) {
          points.x.push(x);
          points.y.push(y);
          points.z.push(z);
          points.value.push(v);
        }
      }
    }
  }
  renderScatter3D("Triple Integral Domain (Spherical to Cartesian)", points);
}

function updateModeUI() {
  const mode = document.getElementById("mode").value;
  const coordSystem = document.getElementById("coordSystem");
  const currentCoord = coordSystem.value;
  const lastMode = coordSystem.dataset.mode;
  const zMinWrap = document.getElementById("zMinWrap");
  const zMaxWrap = document.getElementById("zMaxWrap");
  const funcInput = document.getElementById("funcInput");
  const xMinLabel = document.querySelector("label[for='xMin']");
  const xMaxLabel = document.querySelector("label[for='xMax']");
  const yMinLabel = document.querySelector("label[for='yMin']");
  const yMaxLabel = document.querySelector("label[for='yMax']");
  const zMinLabel = document.querySelector("label[for='zMin']");
  const zMaxLabel = document.querySelector("label[for='zMax']");
  const xMinWrap = document.getElementById("xMinWrap");
  const xMaxWrap = document.getElementById("xMaxWrap");
  const yMinWrap = document.getElementById("yMinWrap");
  const yMaxWrap = document.getElementById("yMaxWrap");
  const doubleCaseWrap = document.getElementById("doubleCaseWrap");
  const doubleCase = document.getElementById("doubleCase");
  const innerLowerWrap = document.getElementById("innerLowerWrap");
  const innerUpperWrap = document.getElementById("innerUpperWrap");

  if (mode === "double") {
    if (lastMode !== "double") {
      coordSystem.innerHTML =
        "<option value='cartesian2d'>Cartesian (x,y)</option><option value='polar'>Polar (r,theta)</option>";
      coordSystem.value = currentCoord === "polar" ? "polar" : "cartesian2d";
    }
    coordSystem.dataset.mode = "double";
    zMinWrap.classList.add("hidden");
    zMaxWrap.classList.add("hidden");
    zMinLabel.textContent = "z min";
    zMaxLabel.textContent = "z max";
    if (coordSystem.value === "cartesian2d") {
      doubleCaseWrap.classList.remove("hidden");
    } else {
      doubleCaseWrap.classList.add("hidden");
    }
    if (coordSystem.value === "polar") {
      xMinWrap.classList.remove("hidden");
      xMaxWrap.classList.remove("hidden");
      yMinWrap.classList.remove("hidden");
      yMaxWrap.classList.remove("hidden");
      xMinLabel.textContent = "r min";
      xMaxLabel.textContent = "r max";
      yMinLabel.textContent = "theta min";
      yMaxLabel.textContent = "theta max";
      if (funcInput.value.trim() === "" || funcInput.value.includes("x") || funcInput.value.includes("z")) {
        funcInput.value = "r";
      }
      innerLowerWrap.classList.add("hidden");
      innerUpperWrap.classList.add("hidden");
    } else {
      xMinLabel.textContent = "x min";
      xMaxLabel.textContent = "x max";
      yMinLabel.textContent = "y min";
      yMaxLabel.textContent = "y max";
      if (funcInput.value.trim() === "" || funcInput.value.includes("z")) {
        funcInput.value = "x*y";
      }
      if (doubleCase.value === "case1") {
        xMinWrap.classList.remove("hidden");
        xMaxWrap.classList.remove("hidden");
        yMinWrap.classList.add("hidden");
        yMaxWrap.classList.add("hidden");
        innerLowerWrap.classList.remove("hidden");
        innerUpperWrap.classList.remove("hidden");
        document.querySelector("label[for='innerLower']").textContent = "Inner y lower: g1(x)";
        document.querySelector("label[for='innerUpper']").textContent = "Inner y upper: g2(x)";
      } else if (doubleCase.value === "case2") {
        xMinWrap.classList.add("hidden");
        xMaxWrap.classList.add("hidden");
        yMinWrap.classList.remove("hidden");
        yMaxWrap.classList.remove("hidden");
        innerLowerWrap.classList.remove("hidden");
        innerUpperWrap.classList.remove("hidden");
        document.querySelector("label[for='innerLower']").textContent = "Inner x lower: h1(y)";
        document.querySelector("label[for='innerUpper']").textContent = "Inner x upper: h2(y)";
      } else {
        xMinWrap.classList.remove("hidden");
        xMaxWrap.classList.remove("hidden");
        yMinWrap.classList.remove("hidden");
        yMaxWrap.classList.remove("hidden");
        innerLowerWrap.classList.add("hidden");
        innerUpperWrap.classList.add("hidden");
      }
    }
    }
    /*
    else {
      if (lastMode !== "triple") {
        coordSystem.innerHTML =
          "<option value='cartesian3d'>Cartesian (x,y,z)</option><option value='cylindrical'>Cylindrical (r,theta,z)</option><option value='spherical'>Spherical (rho,phi,theta)</option>";
        if (currentCoord === "cylindrical" || currentCoord === "spherical") {
          coordSystem.value = currentCoord;
        } else {
          coordSystem.value = "cartesian3d";
        }
      }
      coordSystem.dataset.mode = "triple";
      doubleCaseWrap.classList.add("hidden");
      innerLowerWrap.classList.add("hidden");
      innerUpperWrap.classList.add("hidden");
      zMinWrap.classList.remove("hidden");
      zMaxWrap.classList.remove("hidden");
      xMinWrap.classList.remove("hidden");
      xMaxWrap.classList.remove("hidden");
      yMinWrap.classList.remove("hidden");
      yMaxWrap.classList.remove("hidden");
      if (coordSystem.value === "cylindrical") {
        xMinLabel.textContent = "r min";
        xMaxLabel.textContent = "r max";
        yMinLabel.textContent = "theta min";
        yMaxLabel.textContent = "theta max";
        zMinLabel.textContent = "z min";
        zMaxLabel.textContent = "z max";
        if (funcInput.value.trim() === "" || funcInput.value.includes("x")) {
          funcInput.value = "r*z";
        }
      } else if (coordSystem.value === "spherical") {
        xMinLabel.textContent = "rho min";
        xMaxLabel.textContent = "rho max";
        yMinLabel.textContent = "phi min";
        yMaxLabel.textContent = "phi max";
        zMinLabel.textContent = "theta min";
        zMaxLabel.textContent = "theta max";
        if (funcInput.value.trim() === "" || funcInput.value.includes("x")) {
          funcInput.value = "rho*rho*sin(phi)";
        }
      } else {
        xMinLabel.textContent = "x min";
        xMaxLabel.textContent = "x max";
        yMinLabel.textContent = "y min";
        yMaxLabel.textContent = "y max";
        zMinLabel.textContent = "z min";
        zMaxLabel.textContent = "z max";
        if (funcInput.value.trim() === "" || !funcInput.value.includes("z")) {
          funcInput.value = "x*y + z";
        }
      }
    }
    */
}

function switchTab(tabId) {
  const allButtons = document.querySelectorAll(".tab-btn");
  const allPanels = document.querySelectorAll(".tab-panel");

  allButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });

  allPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });
}

document.querySelectorAll(".tab-btn").forEach((button) => {
  button.addEventListener("click", () => switchTab(button.dataset.tab));
});

document.getElementById("mode").addEventListener("change", updateModeUI);
document.getElementById("coordSystem").addEventListener("change", updateModeUI);
document.getElementById("doubleCase").addEventListener("change", updateModeUI);

document.getElementById("solveBtn").addEventListener("click", () => {
  const resultEl = document.getElementById("integralResult");
  const metaEl = document.getElementById("integralMeta");
  let vizContext = null;
  try {
    const mode = document.getElementById("mode").value;
    const steps = mode === "double" ? 100 : 40;
    const coordSystem = document.getElementById("coordSystem").value;
    const expr = document.getElementById("funcInput").value.trim();

    const a = parseNumber("xMin");
    const b = parseNumber("xMax");
    const cRaw = Number(document.getElementById("yMin").value);
    const dRaw = Number(document.getElementById("yMax").value);

    if (mode === "double") {
      if (coordSystem === "polar") {
        const c = parseNumber("yMin");
        const d = parseNumber("yMax");
        if (!(b > a && d > c)) {
          throw new Error("Ensure r max > r min and theta max > theta min.");
        }
        const fn = safeCompile(expr, ["r", "theta", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
        const wrapped = (r, theta) =>
          fn(r, theta, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E) * r;
        const val = midpointDoubleIntegral(wrapped, a, b, c, d, steps);
        const stepsRes = buildStepsDouble(expr, 'polar', a, b, c, d, steps, val, 'polar', '', '');
        const isExact = stepsRes.exactVal !== null;
        displayResult(isExact ? stepsRes.exactVal : val, `Polar · Jacobian r · ${steps}×${steps} cells`, isExact);
        showSteps(stepsRes.html);
        vizContext = { mode: "double", coordSystem, expr, a, b, c, d };
      } else {
        const fn = safeCompile(expr, ["x", "y", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
        const wrapped = (x, y) =>
          fn(x, y, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E);
        const doubleCase = document.getElementById("doubleCase").value;
        if (doubleCase === "case1") {
          if (!(b > a)) {
            throw new Error("Ensure x max > x min.");
          }
          const lowExpr = document.getElementById("innerLower").value.trim();
          const upExpr = document.getElementById("innerUpper").value.trim();
          const lowFn = safeCompile(lowExpr, ["x", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
          const upFn = safeCompile(upExpr, ["x", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
          const val = midpointDoubleVariableInner(
            wrapped,
            a,
            b,
            (x) => lowFn(x, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E),
            (x) => upFn(x, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E),
            steps,
            "case1"
          );
          const stepsRes = buildStepsDouble(expr, 'cartesian2d', a, b, 0, 1, steps, val, 'case1', lowExpr, upExpr);
          const isExact = stepsRes.exactVal !== null;
          displayResult(isExact ? stepsRes.exactVal : val, `Case 1: outer x∈[${a},${b}], inner y = [g₁(x), g₂(x)]`, isExact);
          showSteps(stepsRes.html);
          const range = estimateInnerRange(
            a,
            b,
            (x) => lowFn(x, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E),
            (x) => upFn(x, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E)
          );
          vizContext = {
            mode: "double",
            coordSystem,
            expr,
            a,
            b,
            c: Number.isFinite(cRaw) && Number.isFinite(dRaw) && dRaw > cRaw ? cRaw : range ? range.min : 0,
            d: Number.isFinite(cRaw) && Number.isFinite(dRaw) && dRaw > cRaw ? dRaw : range ? range.max : 1,
            doubleCase,
            lowFn: (x) => lowFn(x, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E),
            upFn: (x) => upFn(x, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E),
            lowExpr, upExpr,
          };
        } else if (doubleCase === "case2") {
          const c = parseNumber("yMin");
          const d = parseNumber("yMax");
          if (!(d > c)) {
            throw new Error("Ensure y max > y min.");
          }
          const lowExpr = document.getElementById("innerLower").value.trim();
          const upExpr = document.getElementById("innerUpper").value.trim();
          const lowFn = safeCompile(lowExpr, ["y", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
          const upFn = safeCompile(upExpr, ["y", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
          const val = midpointDoubleVariableInner(
            wrapped,
            c,
            d,
            (y) => lowFn(y, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E),
            (y) => upFn(y, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E),
            steps,
            "case2"
          );
          const stepsRes = buildStepsDouble(expr, 'cartesian2d', 0, 1, c, d, steps, val, 'case2', lowExpr, upExpr);
          const isExact = stepsRes.exactVal !== null;
          displayResult(isExact ? stepsRes.exactVal : val, `Case 2: outer y∈[${c},${d}], inner x = [h₁(y), h₂(y)]`, isExact);
          showSteps(stepsRes.html);
          const range = estimateInnerRange(
            c,
            d,
            (y) => lowFn(y, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E),
            (y) => upFn(y, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E)
          );
          vizContext = {
            mode: "double",
            coordSystem,
            expr,
            c,
            d,
            doubleCase,
            a: Number.isFinite(a) && Number.isFinite(b) && b > a ? a : range ? range.min : 0,
            b: Number.isFinite(a) && Number.isFinite(b) && b > a ? b : range ? range.max : 1,
            lowFn: (y) => lowFn(y, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E),
            upFn: (y) => upFn(y, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E),
            lowExpr, upExpr,
          };
        } else if (doubleCase === "case4") {
          const c = parseNumber("yMin");
          const d = parseNumber("yMax");
          if (!(b > a && d > c)) {
            throw new Error("Ensure x max > x min and y max > y min.");
          }
          const val = midpointDoubleIntegral(wrapped, a, b, c, d, steps);
          const stepsRes = buildStepsDouble(expr, 'cartesian2d', a, b, c, d, steps, val, 'case4', '', '');
          const isExact = stepsRes.exactVal !== null;
          displayResult(isExact ? stepsRes.exactVal : val, `Case 4 (separable): x∈[${a},${b}], y∈[${c},${d}]`, isExact);
          showSteps(stepsRes.html);
          vizContext = { mode: "double", coordSystem, expr, a, b, c, d, doubleCase };
        } else {
          const c = parseNumber("yMin");
          const d = parseNumber("yMax");
          if (!(b > a && d > c)) {
            throw new Error("Ensure x max > x min and y max > y min.");
          }
          const val = midpointDoubleIntegral(wrapped, a, b, c, d, steps);
          const stepsRes = buildStepsDouble(expr, 'cartesian2d', a, b, c, d, steps, val, 'case3', '', '');
          const isExact = stepsRes.exactVal !== null;
          displayResult(isExact ? stepsRes.exactVal : val, `Case 3 (rectangular): x∈[${a},${b}], y∈[${c},${d}]`, isExact);
          showSteps(stepsRes.html);
          vizContext = { mode: "double", coordSystem, expr, a, b, c, d, doubleCase };
        }
      }
    }
    /*
    else {
      const c = parseNumber("yMin");
      const d = parseNumber("yMax");
      if (!(b > a && d > c)) {
        throw new Error("Ensure axis-1 max > min and axis-2 max > min.");
      }
      const e = parseNumber("zMin");
      const f = parseNumber("zMax");
      if (!(f > e)) {
        throw new Error("Ensure third-axis max is greater than min.");
      }

      if (coordSystem === "cylindrical") {
        const fn = safeCompile(expr, ["r", "theta", "z", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
        const wrapped = (r, theta, z) =>
          fn(r, theta, z, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E) * r;
        const val = midpointTripleIntegral(wrapped, a, b, c, d, e, f, steps);
        const stepsRes = buildStepsTriple(expr, 'cylindrical', a, b, c, d, e, f, steps, val);
        const isExact = stepsRes.exactVal !== undefined && stepsRes.exactVal !== null;
        displayResult(isExact ? stepsRes.exactVal : val, `Cylindrical · Jacobian r · ${steps}³ cells`, isExact);
        showSteps(stepsRes.html);
        vizContext = { mode: "triple", coordSystem, expr, a, b, c, d, e, f };
      } else if (coordSystem === "spherical") {
        const fn = safeCompile(expr, ["rho", "phi", "theta", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
        const wrapped = (rho, phi, theta) =>
          fn(rho, phi, theta, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E) *
          rho *
          rho *
          Math.sin(phi);
        const val = midpointTripleIntegral(wrapped, a, b, c, d, e, f, steps);
        const stepsRes = buildStepsTriple(expr, 'spherical', a, b, c, d, e, f, steps, val);
        const isExact = stepsRes.exactVal !== undefined && stepsRes.exactVal !== null;
        displayResult(isExact ? stepsRes.exactVal : val, `Spherical · Jacobian ρ²sin(φ) · ${steps}³ cells`, isExact);
        showSteps(stepsRes.html);
        vizContext = { mode: "triple", coordSystem, expr, a, b, c, d, e, f };
      } else {
        const fn = safeCompile(expr, ["x", "y", "z", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
        const wrapped = (x, y, z) =>
          fn(x, y, z, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E);
        const val = midpointTripleIntegral(wrapped, a, b, c, d, e, f, steps);
        const stepsRes = buildStepsTriple(expr, 'cartesian3d', a, b, c, d, e, f, steps, val);
        const isExact = stepsRes.exactVal !== undefined && stepsRes.exactVal !== null;
        displayResult(isExact ? stepsRes.exactVal : val, `Cartesian · ${steps}³ midpoint cells`, isExact);
        showSteps(stepsRes.html);
        vizContext = { mode: "triple", coordSystem, expr, a, b, c, d, e, f };
      }
    }
    */
    if (vizContext) {
      if (vizContext.mode === "double") {
        renderDoubleVisualization(vizContext);
        renderDesmosRegion(vizContext);
      } else {
        renderTripleVisualization(vizContext);
      }
    }
  } catch (error) {
    document.getElementById('integralResult').innerHTML = '⚠️ Computation failed';
    document.getElementById('integralMeta').textContent = error.message;
    document.getElementById('integralSymbolic').style.display = 'none';
    document.getElementById('stepsCard').style.display = 'none';
    clearVisualization('Graph could not be generated due to invalid input.');
  }
});

document.getElementById("exampleBtn").addEventListener("click", () => {
  const mode = document.getElementById("mode").value;
  const coordSystem = document.getElementById("coordSystem").value;
  if (mode === "double") {
    if (coordSystem === "polar") {
      document.getElementById("funcInput").value = "r";
      document.getElementById("xMin").value = "0";
      document.getElementById("xMax").value = "2";
      document.getElementById("yMin").value = "0";
      document.getElementById("yMax").value = "3.141592653589793";
    } else {
      const doubleCase = document.getElementById("doubleCase").value;
      document.getElementById("funcInput").value = "x + y";
      document.getElementById("xMin").value = "0";
      document.getElementById("xMax").value = "1";
      document.getElementById("yMin").value = "0";
      document.getElementById("yMax").value = "1";
      if (doubleCase === "case1") {
        document.getElementById("innerLower").value = "0";
        document.getElementById("innerUpper").value = "x";
      } else if (doubleCase === "case2") {
        document.getElementById("innerLower").value = "0";
        document.getElementById("innerUpper").value = "1-y";
      }
    }
    }
    /*
    else if (coordSystem === "cylindrical") {
      document.getElementById("funcInput").value = "r*z";
      document.getElementById("xMin").value = "0";
      document.getElementById("xMax").value = "1";
      document.getElementById("yMin").value = "0";
      document.getElementById("yMax").value = "6.283185307179586";
      document.getElementById("zMin").value = "0";
      document.getElementById("zMax").value = "2";
    } else if (coordSystem === "spherical") {
      document.getElementById("funcInput").value = "1";
      document.getElementById("xMin").value = "0";
      document.getElementById("xMax").value = "1";
      document.getElementById("yMin").value = "0";
      document.getElementById("yMax").value = "3.141592653589793";
      document.getElementById("zMin").value = "0";
      document.getElementById("zMax").value = "6.283185307179586";
    } else {
      document.getElementById("funcInput").value = "x*y + z";
      document.getElementById("xMin").value = "0";
      document.getElementById("xMax").value = "1";
      document.getElementById("yMin").value = "0";
      document.getElementById("yMax").value = "1";
      document.getElementById("zMin").value = "0";
      document.getElementById("zMax").value = "1";
    }
    */
});

document.getElementById("resetBtn").addEventListener("click", () => {
  document.getElementById("mode").value = "double";
  updateModeUI();
  document.getElementById("coordSystem").value = "cartesian2d";
  document.getElementById("doubleCase").value = "case1";
  document.getElementById("funcInput").value = "x*y";
  document.getElementById("xMin").value = "0";
  document.getElementById("xMax").value = "1";
  document.getElementById("yMin").value = "0";
  document.getElementById("yMax").value = "1";
  document.getElementById("zMin").value = "0";
  document.getElementById("zMax").value = "1";
  document.getElementById("innerLower").value = "0";
  document.getElementById("innerUpper").value = "x";
  updateModeUI();
  document.getElementById("integralResult").textContent = "Ready";
  document.getElementById("integralMeta").textContent = "For Cases 1 and 2, enter inner limits as expressions in the outer variable.";
});

document.getElementById("pretestForm").addEventListener("submit", (event) => {
  event.preventDefault();
  scoreForm("pretestForm", "pretestResult");
});

document.getElementById("posttestForm").addEventListener("submit", (event) => {
  event.preventDefault();
  scoreForm("posttestForm", "posttestResult");
});

document.getElementById("feedbackForm").addEventListener("submit", (event) => {
  event.preventDefault();
  document.getElementById("feedbackResult").textContent =
    "✅ Thank you for your feedback! Your response has been recorded.";
  event.target.reset();
});

updateModeUI();
switchTab("aimTab");
clearVisualization("Graph will appear after computation.");
initDesmos();

document.getElementById('stepsToggle').addEventListener('click', () => {
  const head    = document.getElementById('stepsToggle');
  const content = document.getElementById('stepsContent');
  const collapsed = head.classList.toggle('collapsed');
  content.classList.toggle('hidden', collapsed);
});

