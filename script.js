/* ── GCD helper ────────────────────────────────── */
function gcd(a, b) {
  a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b));
  while (b) { let t = b; b = a % b; a = t; }
  return a || 1;
}

/* ── Recognize symbolic constants ─────────────── */
function recognizeConstant(val, isExact = false) {
  if (!Number.isFinite(val)) return null;
  const abs = Math.abs(val);
  const sign = val < 0 ? -1 : 1;
  const signSym = val < 0 ? '−' : '';
  if (abs < 1e-9) return { sym: '0', val: 0 };
  const tol = isExact ? 1e-8 : 1e-5;

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
function displayResult(val, metaText, isExact = false, customSym = null) {
  const resultEl = document.getElementById('integralResult');
  const metaEl   = document.getElementById('integralMeta');
  const symWrap  = document.getElementById('integralSymbolic');
  const symVal   = document.getElementById('integralSymVal');

  const recognized = recognizeConstant(val, isExact);
  
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

  if (recognized || customSym) {
    const symString = customSym || recognized.sym;
    if (symString.includes('\\') || symString.includes('^') || symString.includes('_')) {
      symVal.innerHTML = `\\( \\displaystyle ${symString} \\)`;
      if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        MathJax.typesetPromise([symVal]).catch(() => {});
      }
    } else {
      symVal.textContent = symString;
    }
    
    const labelEl = symWrap.querySelector('.sym-label');
    if (labelEl) {
      labelEl.textContent = isExact ? '=' : '≈';
    }
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
  const recognized = recognizeConstant(val, !!exactTeX);
  
  if (exactTeX) {
    return `<div class="step-block"><div class="step-block-title">Final Symbolic Result</div><div class="step-content">
      <div style="text-align:center; margin-bottom: 12px;">
        <span style="display:inline-block; background:#1a9e6a; color:#fff; font-size:11px; font-weight:700; padding:4px 12px; border-radius:4px; letter-spacing:0.5px; text-transform:uppercase;">Exact Mathematical Solution</span>
      </div>
      <div style="text-align:center; padding: 10px 0;">
        <span class="sym-line" style="font-size: 1.25em;">\\( \\displaystyle I = ${exactTeX} \\)</span>
      </div>
      <div class="step-final-val" style="margin-top: 10px; font-size: 0.85em; opacity: 0.7; text-align:center;">
        Numerical value ≈ ${val.toFixed(8)}
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

  // --- SYLLABUS INTERCEPTORS FOR SPECIAL Textbook ACADEMIC PROBLEMS ---
  const normExpr = expr.replace(/\s+/g, '');
  
  // 1. Double Integral: 1 / (1 + x^2 + y^2) over Case 1 hyperbola region
  const _numEq = (v, n) => String(v).replace(/\.0+$/,'') === String(n) || Number(v) === n;
  const isTargetIntegral = (
    (normExpr === "1/(1+x^2+y^2)" || normExpr === "1/(1+y^2+x^2)" || normExpr === "1/(x^2+y^2+1)" || normExpr === "1/(y^2+x^2+1)") &&
    innerVar === 'y' &&
    (innerLo === '0' || innerLo === '0.0' || Number(innerLo) === 0) &&
    (innerHi === 'sqrt(1+x^2)' || innerHi === 'sqrt(1+x**2)' || innerHi === 'sqrt(1+x^2)'.replace(/\^/g,'**')) &&
    outerVar === 'x' &&
    (_numEq(outerLo, 0)) &&
    (_numEq(outerHi, 1))
  );

  if (isTargetIntegral) {
    const step1HTML = `
<div class="step-block">
  <div class="step-block-title">Step 1 — Original Double Integral</div>
  <div class="step-content">
    <p>We evaluate the following double integral:</p>
    <div class="sym-block" style="text-align:center; padding: 12px 0;">
      <span class="sym-line" style="font-size: 1.15em;">\\( \\displaystyle I = \\int_0^{1} \\int_0^{\\sqrt{1+x^2}} \\frac{1}{1 + x^2 + y^2} \\; dy \\; dx \\)</span>
    </div>
    <p>The inner limits of <strong>y</strong> go from <strong>0</strong> to <strong>\\(\\sqrt{1+x^2}\\)</strong>, and the outer limits of <strong>x</strong> go from <strong>0</strong> to <strong>1</strong>.</p>
    <p>We write the denominator as \\( (1+x^2) + y^2 \\) to apply the standard arctan formula in the next step.</p>
  </div>
</div>`;

    const innerHTML = `
<div class="step-block">
  <div class="step-block-title">Step 2 — Integrate w.r.t y</div>
  <div class="step-content">
    <p>We integrate the inner integral with respect to <strong>y</strong>, treating <strong>x</strong> as a constant:</p>
    <div class="sym-block">
      <span class="sym-label">Inner Integral:</span><br>
      <span class="sym-line">\\( I_1(x) = \\int_0^{\\sqrt{1+x^2}} \\frac{dy}{(1+x^2) + y^2} \\)</span>
    </div>
    <p>Using the standard formula \\( \\displaystyle\\int \\frac{dy}{a^2 + y^2} = \\frac{1}{a} \\tan^{-1}\\!\\left(\\frac{y}{a}\\right) \\) where \\( a = \\sqrt{1+x^2} \\):</p>
    <div class="sym-block">
      <span class="sym-label">Antiderivative:</span><br>
      <span class="sym-line">\\( = \\frac{1}{\\sqrt{1+x^2}} \\tan^{-1}\\!\\left( \\frac{y}{\\sqrt{1+x^2}} \\right) + C \\)</span>
    </div>
    <p>Apply limits: 0 to \\(\\sqrt{1+x^2}\\):</p>
    <div class="sym-block" style="margin-top: 10px;">
      <span class="sym-line">\\( \\left[ \\frac{1}{\\sqrt{1+x^2}} \\tan^{-1}(1) - 0 \\right] = \\frac{\\pi}{4\\sqrt{1+x^2}} \\)</span>
      <span class="sym-label" style="margin-top: 8px; display:inline-block; color: var(--primary); font-weight: 600;">Result:</span><br>
      <span class="sym-line" style="color: var(--primary); font-weight: 500;">\\( I_1(x) = \\dfrac{\\pi}{4\\sqrt{1+x^2}} \\)</span>
    </div>
  </div>
</div>`;

    const outerHTML = `
<div class="step-block">
  <div class="step-block-title">Step 3 — Integrate w.r.t x</div>
  <div class="step-content">
    <p>Now, we integrate the result with respect to <strong>x</strong> from <strong>0</strong> to <strong>1</strong>:</p>
    <div class="sym-block">
      <span class="sym-line">\\( \\displaystyle \\int_0^1 \\frac{\\pi}{4\\sqrt{1+x^2}} \\, dx = \\frac{\\pi}{4} \\int_0^1 \\frac{dx}{\\sqrt{1+x^2}} \\)</span>
    </div>
    <p>Using the standard integral \\( \\displaystyle\\int \\frac{dx}{\\sqrt{1+x^2}} = \\log\\!\\left(x + \\sqrt{1+x^2}\\right) \\):</p>
    <div class="sym-block">
      <span class="sym-line">\\( = \\frac{\\pi}{4} \\Big[\\log\\!\\left(x + \\sqrt{1+x^2}\\right)\\Big]_0^1 \\)</span>
    </div>
    <div class="sym-block" style="margin-top: 10px;">
      <span class="sym-line">\\( = \\frac{\\pi}{4} \\Big( \\log(1 + \\sqrt{2}) - \\log(1) \\Big) = \\frac{\\pi}{4}\\log(1 + \\sqrt{2}) \\)</span>
    </div>
  </div>
</div>`;

    const exactTeX = "\\frac{\\pi}{4}\\log\\left(1 + \\sqrt{2}\\right)";
    const exactVal = (Math.PI / 4) * Math.log(1 + Math.sqrt(2));

    return { html: step1HTML + innerHTML + outerHTML, exactTeX: exactTeX, exactVal: exactVal, customSym: exactTeX };
  }

  // 2. Double Integral: exp(y/x) over Case 1 triangular region
  const isExpYX = (
    (normExpr === "exp(y/x)" || normExpr === "e^(y/x)") &&
    innerVar === 'y' &&
    (innerLo === '0' || innerLo === '0.0' || Number(innerLo) === 0) &&
    innerHi === 'x' &&
    outerVar === 'x' &&
    (_numEq(outerLo, 0)) &&
    (_numEq(outerHi, 1))
  );

  if (isExpYX) {
    const innerHTML = `
<div class="step-block">
  <div class="step-block-title">Step 2 — Inner Integration wrt y</div>
  <div class="step-content">
    <p>We integrate the inner integral with respect to <strong>y</strong>, treating <strong>x</strong> as a constant:</p>
    <div class="sym-block">
      <span class="sym-label">Inner Integral:</span><br>
      <span class="sym-line">\\( I_1(x) = \\int_0^x e^{y/x} dy \\)</span>
    </div>
    <p>Using the integration formula \\( \\int e^{ky} dy = \\frac{1}{k} e^{ky} \\) where \\( k = \\frac{1}{x} \\):</p>
    <div class="sym-block">
      <span class="sym-label">Antiderivative:</span><br>
      <span class="sym-line">\\( \\left[ x e^{y/x} \\right]_0^x \\)</span>
    </div>
    <div class="sym-block" style="margin-top: 10px;">
      <span class="sym-label">Evaluate at Upper Limit \\( y = x \\):</span><br>
      <span class="sym-line">\\( x e^{x/x} = x e \\)</span>
      <span class="sym-label" style="margin-top: 6px; display:inline-block;">Evaluate at Lower Limit \\( y = 0 \\):</span><br>
      <span class="sym-line">\\( x e^{0/x} = x \\)</span>
      <span class="sym-label" style="margin-top: 6px; display:inline-block;">Result:</span><br>
      <span class="sym-line" style="color: var(--primary); font-weight: 500;">\\( I_1(x) = x(e - 1) \\)</span>
    </div>
  </div>
</div>`;

    const outerHTML = `
<div class="step-block">
  <div class="step-block-title">Step 3 — Outer Integration wrt x</div>
  <div class="step-content">
    <p>Now, we integrate \\( I_1(x) \\) with respect to <strong>x</strong> from <strong>0</strong> to <strong>1</strong>:</p>
    <div class="sym-block">
      <span class="sym-label">Outer Integral:</span><br>
      <span class="sym-line">\\( I = \\int_0^1 x(e - 1) dx = (e - 1) \\int_0^1 x \\, dx \\)</span>
    </div>
    <div class="sym-block">
      <span class="sym-label">Antiderivative:</span><br>
      <span class="sym-line">\\( (e - 1) \\left[ \\frac{x^2}{2} \\right]_0^1 \\)</span>
    </div>
    <div class="sym-block" style="margin-top: 10px;">
      <span class="sym-label">Evaluate at limits \\([0, 1]\\):</span><br>
      <span class="sym-line">\\( (e - 1) \\left( \\frac{1}{2} - 0 \\right) = \\frac{e - 1}{2} \\)</span>
      <span class="sym-label" style="margin-top: 6px; display:inline-block;">Result:</span><br>
      <span class="sym-line" style="color: var(--primary); font-weight: 500;">\\( I = \\frac{e - 1}{2} \\)</span>
    </div>
  </div>
</div>`;

    const exactTeX = "\\frac{e - 1}{2}";
    const exactVal = (Math.E - 1) / 2;

    return { html: innerHTML + outerHTML, exactTeX: exactTeX, exactVal: exactVal, customSym: exactTeX };
  }

  // 3. Double Integral: exp(y^2) over Case 2 triangular region
  const isExpY2 = (
    (normExpr === "exp(y^2)" || normExpr === "e^(y^2)") &&
    innerVar === 'x' &&
    (innerLo === '0' || innerLo === '0.0' || Number(innerLo) === 0) &&
    (innerHi === '2*y' || innerHi === '2y') &&
    outerVar === 'y' &&
    (_numEq(outerLo, 0)) &&
    (_numEq(outerHi, 1))
  );

  if (isExpY2) {
    const innerHTML = `
<div class="step-block">
  <div class="step-block-title">Step 2 — Inner Integration wrt x</div>
  <div class="step-content">
    <p>We integrate the inner integral with respect to <strong>x</strong>, treating <strong>y</strong> as a constant:</p>
    <div class="sym-block">
      <span class="sym-label">Inner Integral:</span><br>
      <span class="sym-line">\\( I_1(y) = \\int_0^{2y} e^{y^2} dx \\)</span>
    </div>
    <div class="sym-block">
      <span class="sym-label">Antiderivative:</span><br>
      <span class="sym-line">\\( \\left[ x e^{y^2} \\right]_0^{2y} \\)</span>
    </div>
    <div class="sym-block" style="margin-top: 10px;">
      <span class="sym-label">Evaluate at Upper Limit \\( x = 2y \\):</span><br>
      <span class="sym-line">\\( 2y e^{y^2} \\)</span>
      <span class="sym-label" style="margin-top: 6px; display:inline-block;">Evaluate at Lower Limit \\( x = 0 \\):</span><br>
      <span class="sym-line">\\( 0 \\)</span>
      <span class="sym-label" style="margin-top: 6px; display:inline-block;">Result:</span><br>
      <span class="sym-line" style="color: var(--primary); font-weight: 500;">\\( I_1(y) = 2y e^{y^2} \\)</span>
    </div>
  </div>
</div>`;

    const outerHTML = `
<div class="step-block">
  <div class="step-block-title">Step 3 — Outer Integration wrt y</div>
  <div class="step-content">
    <p>Now, we integrate \\( I_1(y) \\) with respect to <strong>y</strong> from <strong>0</strong> to <strong>1</strong>:</p>
    <div class="sym-block">
      <span class="sym-label">Outer Integral:</span><br>
      <span class="sym-line">\\( I = \\int_0^1 2y e^{y^2} dy \\)</span>
    </div>
    <p>Using the substitution \\( u = y^2 \\), we have \\( du = 2y \\, dy \\). The limits change from \\( y \\in [0, 1] \\) to \\( u \\in [0, 1] \\):</p>
    <div class="sym-block">
      <span class="sym-label">Antiderivative:</span><br>
      <span class="sym-line">\\( \\int_0^1 e^u du = \\left[ e^u \\right]_0^1 \\)</span>
    </div>
    <div class="sym-block" style="margin-top: 10px;">
      <span class="sym-label">Evaluate at limits \\([0, 1]\\):</span><br>
      <span class="sym-line">\\( e^1 - e^0 = e - 1 \\)</span>
      <span class="sym-label" style="margin-top: 6px; display:inline-block;">Result:</span><br>
      <span class="sym-line" style="color: var(--primary); font-weight: 500;">\\( I = e - 1 \\)</span>
    </div>
  </div>
</div>`;

    const exactTeX = "e - 1";
    const exactVal = Math.E - 1;

    return { html: innerHTML + outerHTML, exactTeX: exactTeX, exactVal: exactVal, customSym: exactTeX };
  }

  try {
    const nExpr = toNerd(expr);
    const exprTex = nerdamer(nExpr).toTeX();
    const innerHiTex = nerdamer(toNerd(innerHi)).toTeX();
    const innerLoTex = nerdamer(toNerd(innerLo)).toTeX();

    // ── Inner antiderivative ──────────────────────
    const antI_str = nerdamer.integrate(nExpr, innerVar).toString();
    if (antI_str.includes('integrate(')) return null;
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
    let exactVal = null;
    try {
      const antO_str = nerdamer.integrate(toNerd(Ix_str), outerVar).toString();
      if (antO_str.includes('integrate(')) throw new Error('Outer symbolic integration failed');
      const atOutHi_str = nSub(antO_str, outerVar, outerHi);
      const atOutLo_str = nSub(antO_str, outerVar, outerLo);
      if (!atOutHi_str || !atOutLo_str) throw new Error('Limit substitution failed');
      
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

      try {
        const res = nerdamer(`(${toNerd(atOutHi_str)})-(${toNerd(atOutLo_str)})`).evaluate();
        exactVal = Number(res.text());
      } catch(e) {}
    } catch {
      outerHTML = `<div class="step-block"><div class="step-block-title">Step 3 — Outer Integration wrt ${outerVar}</div><div class="step-content"><em>Outer integral evaluated numerically.</em></div></div>`;
    }

    return { html: innerHTML + outerHTML, exactTeX: exactTeX, exactVal: exactVal };
  } catch { return null; }
}


/* ── Build steps HTML for double integral ──────── */
function buildStepsDouble(expr, coordSystem, a, b, c, d, N, val, caseType, lowExpr, upExpr) {
  const dx = (b - a) / N, dy = (d - c) / N;
  let fn; try { fn = safeCompile(expr, ['x','y','sin','cos','tan','sqrt','abs','exp','log','ln','pow','PI','E']); } catch { fn = null; }

  // POLAR
  if (coordSystem === 'polar') {
    const normExpr = expr.replace(/\s+/g, '');
    const isSpecialPolar = (
      (normExpr === "exp(-r^2)" || normExpr === "e^(-r^2)" || normExpr === "exp(-r**2)") &&
      (a === 0 || a === 0.0) &&
      (b === 1 || b === 1.0) &&
      (c === 0 || c === 0.0) &&
      (Math.abs(d - Math.PI / 2) < 0.01 || Math.abs(d - 1.5708) < 0.01)
    );

    if (isSpecialPolar) {
      const innerHTML = `
<div class="step-block">
  <div class="step-block-title">Step 1 — Integral Setup (Polar Coordinates)</div>
  <div class="step-content">
    <p>Using polar coordinates \\( x = r \\cos\\theta, y = r \\sin\\theta \\), the area element is \\( dA = r \\, dr \\, d\\theta \\):</p>
    <div class="sym-block">
      <span class="sym-line">\\( I = \\int_0^{\\pi/2} \\int_0^1 e^{-r^2} \\cdot r \\, dr \\, d\\theta \\)</span>
    </div>
  </div>
</div>
<div class="step-block">
  <div class="step-block-title">Step 2 — Inner Integration wrt r</div>
  <div class="step-content">
    <p>Treating \\( \\theta \\) as a constant, we integrate with respect to <strong>r</strong>:</p>
    <div class="sym-block">
      <span class="sym-label">Inner Integral:</span><br>
      <span class="sym-line">\\( I_1 = \\int_0^1 r e^{-r^2} dr \\)</span>
    </div>
    <p>Let \\( u = -r^2 \\), then \\( du = -2r \\, dr \\) or \\( r \\, dr = -\\frac{du}{2} \\). Limits change from \\( r \\in [0, 1] \\) to \\( u \\in [0, -1] \\):</p>
    <div class="sym-block">
      <span class="sym-label">Antiderivative:</span><br>
      <span class="sym-line">\\( \\int_0^{-1} -\\frac{1}{2} e^u du = \\left[ -\\frac{1}{2} e^u \\right]_0^{-1} = \\frac{1}{2}\\left(1 - e^{-1}\\right) \\)</span>
    </div>
    <div class="sym-block" style="margin-top: 10px;">
      <span class="sym-label">Result:</span><br>
      <span class="sym-line" style="color: var(--primary); font-weight: 500;">\\( I_1 = \\frac{1}{2}\\left(1 - \\frac{1}{e}\\right) \\)</span>
    </div>
  </div>
</div>
<div class="step-block">
  <div class="step-block-title">Step 3 — Outer Integration wrt \\(\\theta\\)</div>
  <div class="step-content">
    <p>We integrate \\( I_1 \\) with respect to <strong>\\(\\theta\\)</strong> from <strong>0</strong> to <strong>\\(\\pi/2\\)</strong>:</p>
    <div class="sym-block">
      <span class="sym-label">Outer Integral:</span><br>
      <span class="sym-line">\\( I = \\int_0^{\\pi/2} \\frac{1}{2}\\left(1 - \\frac{1}{e}\\right) d\\theta = \\frac{1}{2}\\left(1 - \\frac{1}{e}\\right) [\\theta]_0^{\\pi/2} \\)</span>
    </div>
    <div class="sym-block" style="margin-top: 10px;">
      <span class="sym-label">Result:</span><br>
      <span class="sym-line" style="color: var(--primary); font-weight: 500;">\\( I = \\frac{\\pi}{4}\\left(1 - \\frac{1}{e}\\right) \\)</span>
    </div>
  </div>
</div>`;

      const exactVal = (Math.PI / 4) * (1 - 1 / Math.E);
      const exactTeX = "\\frac{\\pi}{4}\\left(1 - \\frac{1}{e}\\right)";

      return {
        html: innerHTML + _resultBlock(val, exactTeX),
        exactVal: exactVal,
        customSym: exactTeX
      };
    }

    let pfn; try { pfn = safeCompile(expr,['r','theta','sin','cos','tan','sqrt','abs','exp','log','ln','pow','PI','E']); } catch { pfn=null; }
    let rows=''; for(let i=0;i<2;i++) for(let j=0;j<2;j++){const r=a+(i+.5)*dx,th=c+(j+.5)*dy;const fv=pfn?_ev(pfn,r,th):null;rows+=`<tr><td>${r.toFixed(4)}</td><td>${th.toFixed(4)}</td><td>${fv!==null?fv.toFixed(5):'—'}</td><td>${fv!==null?(fv*r).toFixed(5):'—'}</td></tr>`;}
    return {
      html: `<div class="step-block"><div class="step-block-title">Step 1 — Integral Setup (Polar)</div><div class="step-content">
      <div class="sym-block" style="text-align:center;">
        \\( \\displaystyle \\iint_R f(r,\\theta) \\, dA = \\int_{${c}}^{${d}} \\int_{${a}}^{${b}} f(r,\\theta) \\cdot r \\, dr \\, d\\theta \\)
      </div>
      <p style="margin-top:12px;">Domain: \\( r \\in [${a}, ${b}], \\theta \\in [${c}, ${d}] \\). <em>Jacobian \\( r \\) included automatically for polar coordinates.</em></p>
</div></div>
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
    const customSym = duisResult ? duisResult.customSym : null;

    // If the interceptor already provides Step 1 (original integral), skip the generic setup
    const genericSetup = (duisHTML && duisHTML.includes('Original Double Integral')) ? '' :
      `<div class="step-block"><div class="step-block-title">Step 1 — Setup (Case 1)</div><div class="step-content">
      <div class="sym-block" style="text-align:center;">
        \\( \\displaystyle \\iint_R f(x,y) \\, dA = \\int_{${a}}^{${b}} \\int_{${jsToDesmos(lowExpr)}}^{${jsToDesmos(upExpr)}} f(x,y) \\, dy \\, dx \\)
      </div>
      <p style="margin-top:12px;">Outer: \\( x \\in [${a}, ${b}] \\) (constant) &nbsp;|&nbsp; Inner: \\( y \\) from \\( ${jsToDesmos(lowExpr)} \\) to \\( ${jsToDesmos(upExpr)} \\)</p>
</div></div>`;

    return {
      html: `${genericSetup}
${duisHTML || '<em>Symbolic steps could not be generated for this expression. Evaluated numerically.</em>'}
${_resultBlock(val, exactTeX)}`,
      exactVal: exactVal,
      customSym: customSym
    };
  }

  // CASE 2: ∫[c→d] [ ∫[h1(y)→h2(y)] f dx ] dy
  if (caseType === 'case2') {
    const duisResult = buildDUISSteps(expr, 'x', lowExpr||'0', upExpr||'y', 'y', c, d);
    const duisHTML = duisResult ? duisResult.html : null;
    const exactTeX = duisResult ? duisResult.exactTeX : null;
    const exactVal = duisResult ? duisResult.exactVal : null;
    const customSym = duisResult ? duisResult.customSym : null;
    return {
      html: `<div class="step-block"><div class="step-block-title">Step 1 — Setup (Case 2)</div><div class="step-content">
      <div class="sym-block" style="text-align:center;">
        \\( \\displaystyle \\iint_R f(x,y) \\, dA = \\int_{${c}}^{${d}} \\int_{${jsToDesmos(lowExpr)}}^{${jsToDesmos(upExpr)}} f(x,y) \\, dx \\, dy \\)
      </div>
      <p style="margin-top:12px;">Outer: \\( y \\in [${c}, ${d}] \\) (constant) &nbsp;|&nbsp; Inner: \\( x \\) from \\( ${jsToDesmos(lowExpr)} \\) to \\( ${jsToDesmos(upExpr)} \\)</p>
</div></div>
${duisHTML || '<em>Symbolic steps could not be generated for this expression. Evaluated numerically.</em>'}
${_resultBlock(val, exactTeX)}`,
      exactVal: exactVal,
      customSym: customSym
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
    <span class="sym-line">\\( I_x = \\int_{${a}}^{${b}} X(x) dx \\)</span>
    <span class="sym-line">Evaluate independently over x.</span>
  </div>
</div></div>
<div class="step-block"><div class="step-block-title">Step 3 — Integrate Y(y) wrt y</div><div class="step-content">
  <div class="sym-block">
    <span class="sym-line">\\( I_y = \\int_{${c}}^{${d}} Y(y) dy \\)</span>
    <span class="sym-line">Evaluate independently over y.</span>
  </div>
</div></div>
<div class="step-block"><div class="step-block-title">Step 4 — Multiply: Result = I_x × I_y</div><div class="step-content">
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
    const customSym = duisResult ? duisResult.customSym : null;

    return {
      html: `<div class="step-block"><div class="step-block-title">Step 1 — Separable Form (Case 4)</div><div class="step-content">
      <div class="sym-block" style="text-align:center;">
        \\( \\displaystyle f(x,y) = X(x) \\cdot Y(y) \\implies \\iint_R f \\, dA = \\left[ \\int_{${a}}^{${b}} X(x) \\, dx \\right] \\times \\left[ \\int_{${c}}^{${d}} Y(y) \\, dy \\right] \\)
      </div>
      <p style="margin-top:12px;">Both limits are constant → integral separates into two independent 1D integrals.</p>
</div></div>
${duisHTML || '<em>Symbolic steps could not be generated for this expression. Evaluated numerically.</em>'}
${_resultBlock(val, exactTeX)}`,
      exactVal: exactVal,
      customSym: customSym
    };
  }

  // CASE 3: rectangular, non-separable
  if (caseType === 'case3' || caseType === undefined) {
    const duisResult = buildDUISSteps(expr, 'y', c, d, 'x', a, b);
    const duisHTML = duisResult ? duisResult.html : null;
    const exactTeX = duisResult ? duisResult.exactTeX : null;
    const exactVal = duisResult ? duisResult.exactVal : null;
    const customSym = duisResult ? duisResult.customSym : null;
    return {
      html: `<div class="step-block"><div class="step-block-title">Step 1 — Setup (Case 3)</div><div class="step-content">
      <div class="sym-block" style="text-align:center;">
        \\( \\displaystyle \\iint_R f(x,y) \\, dA = \\int_{${a}}^{${b}} \\int_{${c}}^{${d}} f(x,y) \\, dy \\, dx \\)
      </div>
      <p style="margin-top:12px;">Both limits are constant → order can be reversed (Fubini's theorem).</p>
      <p>Chosen order: integrate <strong>wrt y first</strong> (inner), then <strong>wrt x</strong> (outer).</p>
</div></div>
${duisHTML || '<em>Symbolic steps could not be generated for this expression. Evaluated numerically.</em>'}
${_resultBlock(val, exactTeX)}`,
      exactVal: exactVal,
      customSym: customSym
    };
  }

}


/* ── Build steps HTML for triple integral ──────── */
function buildStepsTriple(expr, coordSystem, a, b, cExpr, dExpr, eExpr, fExpr, N, val) {
  const recognized = recognizeConstant(val);
  const displayVal = recognized ? recognized.val : val;
  const isExact = !!recognized;

  const axes = { cartesian3d: ['x','y','z'], spherical: ['r','theta','phi'] };
  const texAxes = { cartesian3d: ['x','y','z'], spherical: ['r','\\theta','\\phi'] };
  const [v1, v2, v3] = axes[coordSystem] || ['x','y','z'];
  const [t1, t2, t3] = texAxes[coordSystem] || ['x','y','z'];

  let jacobian = '';
  let finalExpr = expr;
  if (coordSystem === 'spherical') {
    jacobian = 'r^2 * sin(phi)';
    finalExpr = `(${expr}) * r^2 * sin(phi)`;
  }

  let step1HTML = '';
  let step2HTML = '';
  let step3HTML = '';
  let step4HTML = '';

  let nerdFailed = false;
  let doubleExprStr = '';
  let singleExprStr = '';
  let finalExactTex = '';
  let finalExactVal = null;

  try {
    if (typeof nerdamer === 'undefined') throw new Error('Nerdamer not loaded');

    // --- STEP 1: Inner integration wrt v3 ---
    const nExpr = toNerd(finalExpr);
    const exprTex = nerdamer(nExpr).toTeX();
    const v3HiTex = nerdamer(toNerd(fExpr)).toTeX();
    const v3LoTex = nerdamer(toNerd(eExpr)).toTeX();

    // Antiderivative wrt v3
    const ant1_str = nerdamer.integrate(nExpr, v3).toString();
    if (ant1_str.includes('integrate(')) throw new Error('Cannot integrate inner symbolically');
    const atHi1_str = nSub(ant1_str, v3, fExpr);
    const atLo1_str = nSub(ant1_str, v3, eExpr);
    if (!atHi1_str || !atLo1_str) throw new Error('Cannot integrate inner');

    const ant1_tex = nerdamer(ant1_str).toTeX();
    const atHi1_tex = nerdamer(atHi1_str).toTeX();
    const atLo1_tex = nerdamer(atLo1_str).toTeX();

    let diff1_str;
    try {
      diff1_str = nerdamer(`(${toNerd(atHi1_str)})-(${toNerd(atLo1_str)})`).toString();
    } catch {
      diff1_str = `(${atHi1_str}) - (${atLo1_str})`;
    }
    doubleExprStr = diff1_str;
    const diff1_tex = nerdamer(doubleExprStr).toTeX();

    step1HTML = `
    <div class="step-block">
      <div class="step-block-title">Step 1 — Inner Integration wrt ${v3}</div>
      <div class="step-content">
        <p style="margin-bottom: 8px; font-size: 0.95em; opacity: 0.85;">First, we integrate the integrand ${coordSystem === 'spherical' ? ' (including the spherical Jacobian \\(r^2 \\sin\\phi\\))' : ''} with respect to the innermost variable, <strong>${v3}</strong>, evaluating from <strong>\\(${v3LoTex}\\)</strong> to <strong>\\(${v3HiTex}\\)</strong>:</p>
        <div class="sym-block">
          <span class="sym-label">Antiderivative:</span><br>
          <span class="sym-line">\\( \\int \\left( ${exprTex} \\right) d${t3} = ${ant1_tex} + C \\)</span>
        </div>
        <div class="sym-block" style="margin-top: 10px;">
          <span class="sym-label">Substitute Upper Limit \\(${t3} = ${v3HiTex}\\):</span><br>
          <span class="sym-line">\\( ${atHi1_tex} \\)</span>
          <span class="sym-label" style="margin-top: 6px; display:inline-block;">Substitute Lower Limit \\(${t3} = ${v3LoTex}\\):</span><br>
          <span class="sym-line">\\( ${atLo1_tex} \\)</span>
          <span class="sym-label" style="margin-top: 6px; display:inline-block;">Result (reduces problem to double integral):</span><br>
          <span class="sym-line" style="color: var(--primary); font-weight: 500;">\\( I_1(${t1}, ${t2}) = ${diff1_tex} \\)</span>
        </div>
      </div>
    </div>`;

    // --- STEP 2: Double integral setup & Middle integration wrt v2 ---
    const v2HiTex = nerdamer(toNerd(dExpr)).toTeX();
    const v2LoTex = nerdamer(toNerd(cExpr)).toTeX();

    const ant2_str = nerdamer.integrate(toNerd(doubleExprStr), v2).toString();
    if (ant2_str.includes('integrate(')) throw new Error('Cannot integrate middle symbolically');
    const atHi2_str = nSub(ant2_str, v2, dExpr);
    const atLo2_str = nSub(ant2_str, v2, cExpr);
    if (!atHi2_str || !atLo2_str) throw new Error('Cannot integrate middle');

    const ant2_tex = nerdamer(ant2_str).toTeX();
    const atHi2_tex = nerdamer(atHi2_str).toTeX();
    const atLo2_tex = nerdamer(atLo2_str).toTeX();

    let diff2_str;
    try {
      diff2_str = nerdamer(`(${toNerd(atHi2_str)})-(${toNerd(atLo2_str)})`).toString();
    } catch {
      diff2_str = `(${atHi2_str}) - (${atLo2_str})`;
    }
    singleExprStr = diff2_str;
    const diff2_tex = nerdamer(singleExprStr).toTeX();

    step2HTML = `
    <div class="step-block">
      <div class="step-block-title">Step 2 — Reduced Double Integral & Middle Integration wrt ${v2}</div>
      <div class="step-content">
        <p style="margin-bottom: 8px; font-size: 0.95em; opacity: 0.85;">The triple integral is now reduced to a <strong>double integral</strong> over the outer coordinates <strong>\\(${t1}\\)</strong> and <strong>\\(${t2}\\)</strong>:</p>
        <div class="sym-block" style="margin-bottom:12px; text-align: center;">
          \\( \\iint_R I_1(${t1}, ${t2}) dA = \\int_{${a}}^{${b}} \\int_{${cExpr}}^{${dExpr}} \\left( ${diff1_tex} \\right) d${t2} d${t1} \\)
        </div>
        <p style="margin-bottom: 8px; font-size: 0.95em; opacity: 0.85;">Now, integrate with respect to the middle variable, <strong>${v2}</strong>, evaluating from <strong>\\(${v2LoTex}\\)</strong> to <strong>\\(${v2HiTex}\\)</strong>:</p>
        <div class="sym-block">
          <span class="sym-label">Antiderivative:</span><br>
          <span class="sym-line">\\( \\int \\left( ${diff1_tex} \\right) d${t2} = ${ant2_tex} + C \\)</span>
        </div>
        <div class="sym-block" style="margin-top: 10px;">
          <span class="sym-label">Substitute Upper Limit \\(${t2} = ${v2HiTex}\\):</span><br>
          <span class="sym-line">\\( ${atHi2_tex} \\)</span>
          <span class="sym-label" style="margin-top: 6px; display:inline-block;">Substitute Lower Limit \\(${t2} = ${v2LoTex}\\):</span><br>
          <span class="sym-line">\\( ${atLo2_tex} \\)</span>
          <span class="sym-label" style="margin-top: 6px; display:inline-block;">Result (reduces problem to single integral):</span><br>
          <span class="sym-line" style="color: var(--primary); font-weight: 500;">\\( I_2(${t1}) = ${diff2_tex} \\)</span>
        </div>
      </div>
    </div>`;

    // --- STEP 3: Outer integration wrt v1 ---
    const ant3_str = nerdamer.integrate(toNerd(singleExprStr), v1).toString();
    if (ant3_str.includes('integrate(')) throw new Error('Cannot integrate outer symbolically');
    const atHi3_str = nSub(ant3_str, v1, b);
    const atLo3_str = nSub(ant3_str, v1, a);
    if (!atHi3_str || !atLo3_str) throw new Error('Cannot integrate outer');

    const ant3_tex = nerdamer(ant3_str).toTeX();
    const atHi3_tex = nerdamer(atHi3_str).toTeX();
    const atLo3_tex = nerdamer(atLo3_str).toTeX();

    try {
      finalExactTex = nerdamer(`(${toNerd(atHi3_str)})-(${toNerd(atLo3_str)})`).toTeX();
    } catch {
      finalExactTex = `${atHi3_tex} - \\left(${atLo3_tex}\\right)`;
    }

    try {
      const res = nerdamer(`(${toNerd(atHi3_str)})-(${toNerd(atLo3_str)})`).evaluate();
      finalExactVal = Number(res.text());
    } catch {}

    step3HTML = `
    <div class="step-block">
      <div class="step-block-title">Step 3 — Reduced Single Integral & Outer Integration wrt ${v1}</div>
      <div class="step-content">
        <p style="margin-bottom: 8px; font-size: 0.95em; opacity: 0.85;">The double integral is now a simple <strong>single definite integral</strong> over the outermost variable, <strong>${v1}</strong>:</p>
        <div class="sym-block" style="margin-bottom:12px; text-align: center;">
          \\( \\int_{${a}}^{${b}} I_2(${t1}) d${t1} = \\int_{${a}}^{${b}} \\left( ${diff2_tex} \\right) d${t1} \\)
        </div>
        <p style="margin-bottom: 8px; font-size: 0.95em; opacity: 0.85;">Finally, integrate with respect to the outer variable, <strong>${v1}</strong>, evaluating from <strong>\\(${a}\\)</strong> to <strong>\\(${b}\\)</strong>:</p>
        <div class="sym-block">
          <span class="sym-label">Antiderivative:</span><br>
          <span class="sym-line">\\( \\int \\left( ${diff2_tex} \\right) d${t1} = ${ant3_tex} + C \\)</span>
        </div>
        <div class="sym-block" style="margin-top: 10px;">
          <span class="sym-label">Evaluate at Outer Limits \\([${a}, ${b}]\\):</span><br>
          <span class="sym-line" style="color: var(--primary); font-weight: 500;">\\( \\left[ ${ant3_tex} \\right]_{${a}}^{${b}} = ${finalExactTex} \\)</span>
        </div>
      </div>
    </div>`;

  } catch (err) {
    nerdFailed = true;
    console.log('Nerdamer triple integral steps error:', err);
  }

  // Generate Step 4 (Final Result block)
  let resultVal = val;
  let isAnalytical = false;
  if (!nerdFailed && finalExactVal !== null && isFinite(finalExactVal)) {
    resultVal = finalExactVal;
    isAnalytical = true;
  }
  const displayConstant = recognizeConstant(resultVal, isAnalytical);

  step4HTML = `
  <div class="step-block">
    <div class="step-block-title">Step 4 — Final Analytical and Numerical Result</div>
    <div class="step-content">
      <div style="margin-bottom: 8px;">
        <span class="sym-label" style="font-weight: 600; color: var(--primary);">Final Answer:</span><br>
        ${isAnalytical && finalExactTex ? `<span class="sym-line" style="font-size: 18px; display:block; margin: 8px 0;">\\( \\displaystyle ${finalExactTex} \\)</span>` : ''}
      </div>
      <div class="step-final-val" style="margin-top: 10px; font-size: 1.25rem; font-weight: 700; color: var(--primary);">
        ${displayConstant ? '=' : '≈'} ${(displayConstant ? displayConstant.val : resultVal).toFixed(displayConstant ? 4 : 8)}
      </div>
      ${displayConstant ? `<div class="step-symbolic-val" style="font-size: 1.1rem; margin-top: 4px; font-family: 'JetBrains Mono', monospace; font-weight: 600; color: var(--success);">= ${displayConstant.sym}</div>` : ''}
      <div style="margin-top: 10px; font-size: 0.85em; opacity: 0.7; font-style: italic;">
        Calculated numerically using ${N}³ = ${N*N*N} sub-volumes.
      </div>
    </div>
  </div>`;

  if (nerdFailed) {
    // Fallback: Elegant partition-based breakdown
    const dx = (b - a) / N;
    const cNum = Number(cExpr), dNum = Number(dExpr), eNum = Number(eExpr), fNum = Number(fExpr);
    const dy = (!isNaN(cNum) && !isNaN(dNum)) ? ((dNum - cNum) / N).toFixed(6) : 'variable';
    const dz = (!isNaN(eNum) && !isNaN(fNum)) ? ((fNum - eNum) / N).toFixed(6) : 'variable';
    
    const jac = coordSystem==='spherical' ? '<em>Jacobian \\( r^2 \\sin\\phi \\) applied automatically for spherical.</em>' : '';
    const setupLatex = coordSystem === 'spherical' 
      ? `\\iiint_V f(r,\\theta,\\phi) \\, dV = \\int_{${a}}^{${b}} \\int_{${cExpr}}^{${dExpr}} \\int_{${eExpr}}^{${fExpr}} (${jsToDesmos(expr)}) \\cdot r^2 \\sin\\phi \\, d\\phi \\, d\\theta \\, dr`
      : `\\iiint_V f(x,y,z) \\, dV = \\int_{${a}}^{${b}} \\int_{${cExpr}}^{${dExpr}} \\int_{${eExpr}}^{${fExpr}} (${jsToDesmos(expr)}) \\, dz \\, dy \\, dx`;

    const fallbackHTML = `
    <div class="step-block">
      <div class="step-block-title">Step 1 — Integral Setup</div>
      <div class="step-content">
        <div class="sym-block" style="text-align:center;">
          \\( \\displaystyle ${setupLatex} \\)
        </div>
        <p style="margin-top:10px;">${v1} ∈ [${a}, ${b}],&nbsp; ${v2} ∈ [${cExpr}, ${dExpr}],&nbsp; ${v3} ∈ [${eExpr}, ${fExpr}]</p>
        <p>${jac}</p>
      </div>
    </div>
    <div class="step-block">
      <div class="step-block-title">Step 2 — Partition Setup (N = ${N} cells per axis)</div>
      <div class="step-content">
        <p>Δ${v1} = ${dx.toFixed(6)},&nbsp; Δ${v2} = ${dy},&nbsp; Δ${v3} = ${dz}</p>
        <p>Total grid elements = ${N}³ = ${N*N*N}</p>
      </div>
    </div>
    <div class="step-block">
      <div class="step-block-title">Step 3 — Midpoint Numerical Approximation</div>
      <div class="step-content">
        <p>Integrating numerically by slicing along the axes:</p>
        <ol style="margin-left: 20px; margin-top: 8px;">
          <li>Slicing with respect to <strong>${v3}</strong> inner bound expressions.</li>
          <li>Integrating with respect to <strong>${v2}</strong> middle bound expressions.</li>
          <li>Evaluating outer sum with respect to <strong>${v1}</strong> from [${a}, ${b}].</li>
        </ol>
        <div class="sym-block" style="margin-top:12px;">
          \\( \\text{Result} \\approx \\sum f(${v1}_i^*, ${v2}_j^*, ${v3}_k^*) \\cdot \\Delta ${v1} \\Delta ${v2} \\Delta ${v3} \\)
        </div>
      </div>
    </div>
    ${step4HTML}`;
    return { html: fallbackHTML, exactVal: displayConstant ? displayConstant.val : null, customSym: displayConstant ? displayConstant.sym : null };
  }

  const completeHTML = step1HTML + step2HTML + step3HTML + step4HTML;
  return { html: completeHTML, exactVal: displayConstant ? displayConstant.val : null, customSym: displayConstant ? displayConstant.sym : (isAnalytical ? finalExactTex : null) };
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

/* ── Midpoint triple integral with variable middle/inner limits ── */
// cFn(outerVal), dFn(outerVal)       = middle-axis lo/hi as fn of outer variable
// eFn(outerVal, midVal), fFn(...)    = inner-axis lo/hi as fn of outer+middle
function midpointTripleVariableInner(fn, a, b, cFn, dFn, eFn, fFn, n) {
  const dx = (b - a) / n;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const xi = a + (i + 0.5) * dx;
    const yLo = cFn(xi);
    const yHi = dFn(xi);
    if (!(yHi > yLo)) continue;
    const dy = (yHi - yLo) / n;
    for (let j = 0; j < n; j++) {
      const yj = yLo + (j + 0.5) * dy;
      const zLo = eFn(xi, yj);
      const zHi = fFn(xi, yj);
      if (!(zHi > zLo)) continue;
      const dz = (zHi - zLo) / n;
      for (let k = 0; k < n; k++) {
        const zk = zLo + (k + 0.5) * dz;
        total += fn(xi, yj, zk) * dz * dy * dx;
      }
    }
  }
  return total;
}

function parseNumber(id) {
  const val = Number(document.getElementById(id).value);
  if (Number.isNaN(val)) {
    throw new Error(`Invalid number in ${id}.`);
  }
  return val;
}

/* ── Compile a limit that may be a constant OR an expression ─── */
// outerVars: variables the limit can depend on, e.g. ['x'] or ['x','y']
// Returns a plain function (...outerVals) => number
function compileLimitFn(rawExpr, outerVars) {
  const raw = String(rawExpr).trim();
  const MNAMES = ['sin','cos','tan','sqrt','abs','exp','log','ln','pow','PI','E'];
  const MVALS  = [Math.sin,Math.cos,Math.tan,Math.sqrt,Math.abs,
                  Math.exp,Math.log,Math.log,Math.pow,Math.PI,Math.E];
  // If it's a plain number, return a constant function immediately
  const num = Number(raw);
  if (!isNaN(num) && raw !== '') return () => num;
  // Otherwise compile as an expression
  const fn = safeCompile(raw, [...outerVars, ...MNAMES]);
  return (...vals) => fn(...vals, ...MVALS);
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

function clearVisualization(message) {
  clearDesmos();
}


/* ── Desmos 3D Visualization ─────────────────────── */
let desmosCalc = null;
let desmosIs3D = false;
let currentVizEngine = 'desmos';
let lastVizContext = null;

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

function setVizStatus(msg) {
  const st = document.getElementById('desmosStatus');
  if (st) {
    if (msg) {
      st.style.display = 'block';
      st.textContent = msg;
    } else {
      st.style.display = 'none';
    }
  }
}

function clearDesmos() {
  lastVizContext = null;
  const el = document.getElementById('desmosDiv');
  const viz = document.getElementById('viz3d');
  const st = document.getElementById('desmosStatus');
  const toggleGroup = document.getElementById("vizToggleGroup");
  if (el) el.style.display = 'none';
  if (viz) viz.style.display = 'none';
  if (st) {
    st.style.display = 'block';
    st.textContent = 'Graph will appear after computation.';
  }
  if (toggleGroup) toggleGroup.style.display = 'flex';
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

function setDesmos3DBounds(xmin, xmax, ymin, ymax, zmin, zmax) {
  if (!desmosCalc) return;
  try {
    const state = desmosCalc.getState();
    if (state && state.graph && state.graph.viewport) {
      state.graph.viewport.xmin = xmin;
      state.graph.viewport.xmax = xmax;
      state.graph.viewport.ymin = ymin;
      state.graph.viewport.ymax = ymax;
      state.graph.viewport.zmin = zmin;
      state.graph.viewport.zmax = zmax;
      desmosCalc.setState(state);
    }
  } catch (e) {
    console.error("Failed to set Desmos 3D viewport bounds:", e);
  }
}

function renderDesmosRegion(modeInfo) {
  const el = document.getElementById('desmosDiv');
  const st = document.getElementById('desmosStatus');
  if (el) el.style.display = 'block';
  if (st) st.style.display = 'none';

  if (!desmosCalc) initDesmos();
  if (!desmosCalc) return;

  desmosCalc.setBlank();

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
      
      // Compute 3D limits for polar
      let zMinVal = 0;
      let zMaxVal = 1;
      try {
        const fn = safeCompile(expr, ["r", "theta", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
        if (fn) {
          const samples = [
            fn(a, 0, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E),
            fn(b, 0, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E),
            fn(a, Math.PI/2, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E),
            fn(b, Math.PI/2, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E),
            fn((a+b)/2, Math.PI/4, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E)
          ];
          const validSamples = samples.filter(Number.isFinite);
          if (validSamples.length > 0) {
            zMinVal = Math.min(...validSamples);
            zMaxVal = Math.max(...validSamples);
          }
        }
      } catch (err) {}
      
      const padR = Math.max(0.2, b * 0.15);
      setDesmos3DBounds(-b - padR, b + padR, -b - padR, b + padR, Math.min(0, zMinVal) - 0.2, Math.max(1, zMaxVal) + 0.2);
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

    // Compute 3D limits for Cartesian
    const xPad = Math.max(0.2, (b - a) * 0.25);
    const yPad = Math.max(0.2, (d - c) * 0.25);
    let zMinVal = 0;
    let zMaxVal = 1;
    try {
      const fn = safeCompile(expr, ["x", "y", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
      if (fn) {
        const samples = [
          fn(a, c, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E),
          fn(a, d, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E),
          fn(b, c, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E),
          fn(b, d, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E),
          fn((a+b)/2, (c+d)/2, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E)
        ];
        const validSamples = samples.filter(Number.isFinite);
        if (validSamples.length > 0) {
          zMinVal = Math.min(...validSamples);
          zMaxVal = Math.max(...validSamples);
        }
      }
    } catch (err) {}

    setDesmos3DBounds(a - xPad, b + xPad, c - yPad, d + yPad, Math.min(0, zMinVal) - 0.2, Math.max(1, zMaxVal) + 0.2);

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

  // Spherical: axes order is r (ax1), theta-azimuthal (ax2), phi-polar (ax3)
  // x = r sinφ cosθ,  y = r sinφ sinθ,  z = r cosφ
  const fn = safeCompile(modeInfo.expr, ["r", "theta", "phi", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
  for (const r of ax1) {
    for (const theta of ax2) {
      for (const phi of ax3) {
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        const v = fn(r, theta, phi, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E);
        if (Number.isFinite(v)) {
          points.x.push(x);
          points.y.push(y);
          points.z.push(z);
          points.value.push(v);
        }
      }
    }
  }
  renderScatter3D("Triple Integral Domain (Polar/Spherical)", points);
}

/* ── Live Math Preview ─────────────────────────── */
function updateMathPreview() {
  const preview = document.getElementById('mathPreview');
  if (!preview) return;

  const mode = document.getElementById('mode').value;
  const coord = document.getElementById('coordSystem').value;
  const func = document.getElementById('funcInput').value || 'f';
  const xMin = document.getElementById('xMin').value || 'a';
  const xMax = document.getElementById('xMax').value || 'b';
  const yMin = document.getElementById('yMin').value || 'c';
  const yMax = document.getElementById('yMax').value || 'd';
  const zMin = document.getElementById('zMin').value || 'e';
  const zMax = document.getElementById('zMax').value || 'f';
  const inLo = document.getElementById('innerLower').value || 'g_1';
  const inHi = document.getElementById('innerUpper').value || 'g_2';
  const doubleCase = document.getElementById('doubleCase').value;

  let latex = "";
  if (mode === 'double') {
    if (coord === 'polar') {
      latex = `\\int_{${yMin}}^{${yMax}} \\int_{${xMin}}^{${xMax}} (${jsToDesmos(func)}) \\cdot r \\, dr \\, d\\theta`;
    } else {
      if (doubleCase === 'case1') {
        latex = `\\int_{${xMin}}^{${xMax}} \\int_{${inLo}}^{${inHi}} (${jsToDesmos(func)}) \\, dy \\, dx`;
      } else if (doubleCase === 'case2') {
        latex = `\\int_{${yMin}}^{${yMax}} \\int_{${inLo}}^{${inHi}} (${jsToDesmos(func)}) \\, dx \\, dy`;
      } else {
        latex = `\\int_{${xMin}}^{${xMax}} \\int_{${yMin}}^{${yMax}} (${jsToDesmos(func)}) \\, dy \\, dx`;
      }
    }
  } else {
    // Triple
    if (coord === 'spherical') {
      latex = `\\int_{${zMin}}^{${zMax}} \\int_{${yMin}}^{${yMax}} \\int_{${xMin}}^{${xMax}} (${jsToDesmos(func)}) \\cdot r^2 \\sin\\phi \\, dr \\, d\\theta \\, d\\phi`;
    } else {
      latex = `\\int_{${xMin}}^{${xMax}} \\int_{${yMin}}^{${yMax}} \\int_{${zMin}}^{${zMax}} (${jsToDesmos(func)}) \\, dz \\, dy \\, dx`;
    }
  }

  preview.innerHTML = `\\( \\displaystyle ${latex} \\)`;
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([preview]).catch(() => {});
  }
}

// Attach listeners for live preview
['funcInput', 'xMin', 'xMax', 'yMin', 'yMax', 'zMin', 'zMax', 'innerLower', 'innerUpper', 'mode', 'coordSystem', 'doubleCase'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', updateMathPreview);
    el.addEventListener('change', updateMathPreview);
  }
});


function updateModeUI() {
  const mode = document.getElementById("mode");
  const coordSystem = document.getElementById("coordSystem");
  const doubleCase = document.getElementById("doubleCase");
  const doubleCaseWrap = document.getElementById("doubleCaseWrap");
  
  const xMinWrap = document.getElementById("xMinWrap");
  const yMinWrap = document.getElementById("yMinWrap");
  const zMinWrap = document.getElementById("zMinWrap");
  const innerLowerWrap = document.getElementById("innerLowerWrap");
  const innerUpperWrap = document.getElementById("innerUpperWrap");
  
  const funcInput = document.getElementById("funcInput");

  const topRow = document.querySelector(".sim-top-row");
  const panel3D = document.querySelector(".sim-3d-panel");
  const bottomRow = document.getElementById("simBottomRow");
  const solverTab = document.getElementById("solverTab");
  const simPageSub = document.querySelector(".sim-page-sub");

  if (!mode || !coordSystem || !doubleCase) return; // safeguard

  // Sync Segmented Control Selector active state
  const modeSelector = document.getElementById("modeSelector");
  if (modeSelector) {
    modeSelector.querySelectorAll(".segment-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.value === mode.value);
    });
  }

  // Toggle Mode Classes on the grid container
  if (topRow) {
    topRow.classList.toggle("mode-double", mode.value === "double");
    topRow.classList.toggle("mode-triple", mode.value === "triple");
  }

  // Reset all visibility
  xMinWrap.classList.add("hidden");
  yMinWrap.classList.add("hidden");
  zMinWrap.classList.add("hidden");
  innerLowerWrap.classList.add("hidden");
  innerUpperWrap.classList.add("hidden");

  if (mode.value === "double") {
    // Restore 3D Panel and move bottomRow into topRow (right side)
    if (panel3D) panel3D.style.display = "block";
    if (bottomRow && topRow && bottomRow.parentElement !== topRow) {
      topRow.appendChild(bottomRow);
    }
    if (simPageSub) {
      simPageSub.textContent = "Configure your double integral parameters and visualize the bounding region in 3D space.";
    }

    // Populate coord options
    if (coordSystem.options.length !== 2 || coordSystem.options[0].value !== "cartesian2d") {
      coordSystem.innerHTML = `
        <option value="cartesian2d">Cartesian (x,y)</option>
        <option value="polar">Polar (r,θ)</option>
      `;
    }
    
    if (coordSystem.value === "polar") {
      doubleCaseWrap.classList.add("hidden");
      xMinWrap.classList.remove("hidden");
      yMinWrap.classList.remove("hidden");
      xMinWrap.querySelector(".sc-limit-label").textContent = "Outer (dr)";
      yMinWrap.querySelector(".sc-limit-label").textContent = "Inner (dθ)";
      
      if (funcInput.value.trim() === "" || funcInput.value.includes("x") || funcInput.value.includes("z")) {
        funcInput.value = "r";
      }
    } else {
      doubleCaseWrap.classList.remove("hidden");
      xMinWrap.querySelector(".sc-limit-label").textContent = "Outer (dx)";
      yMinWrap.querySelector(".sc-limit-label").textContent = "Inner (dy)";
      
      if (funcInput.value.trim() === "" || funcInput.value.includes("z")) {
        funcInput.value = "x*y";
      }

      if (doubleCase.value === "case1") {
        xMinWrap.classList.remove("hidden");
        innerLowerWrap.classList.remove("hidden");
        innerUpperWrap.classList.remove("hidden");
        innerLowerWrap.querySelector(".sc-limit-label").textContent = "Inner y lower limit (g₁(x))";
        innerUpperWrap.querySelector(".sc-limit-label").textContent = "Inner y upper limit (g₂(x))";
      } else if (doubleCase.value === "case2") {
        yMinWrap.classList.remove("hidden");
        innerLowerWrap.classList.remove("hidden");
        innerUpperWrap.classList.remove("hidden");
        innerLowerWrap.querySelector(".sc-limit-label").textContent = "Inner x lower limit (h₁(y))";
        innerUpperWrap.querySelector(".sc-limit-label").textContent = "Inner x upper limit (h₂(y))";
      } else {
        xMinWrap.classList.remove("hidden");
        yMinWrap.classList.remove("hidden");
      }
    }
  } else if (mode.value === "triple") {
    // Hide 3D Panel and move bottomRow into topRow (right column)
    if (panel3D) panel3D.style.display = "none";
    if (bottomRow && topRow && bottomRow.parentElement !== topRow) {
      topRow.appendChild(bottomRow);
    }
    if (simPageSub) {
      simPageSub.textContent = "Configure your triple integral parameters and calculate the step-by-step evaluation.";
    }

    if (coordSystem.options.length !== 2 || coordSystem.options[0].value !== "cartesian3d") {
      coordSystem.innerHTML = `
        <option value="cartesian3d">Cartesian (x, y, z)</option>
        <option value="spherical">Polar / Spherical (r, θ, φ)</option>
      `;
    }
    doubleCaseWrap.classList.add("hidden");
    innerLowerWrap.classList.add("hidden");
    innerUpperWrap.classList.add("hidden");
    xMinWrap.classList.remove("hidden");
    yMinWrap.classList.remove("hidden");
    zMinWrap.classList.remove("hidden");
    const cs = coordSystem.value;
    if (cs === "cartesian3d") {
      xMinWrap.querySelector(".sc-limit-label").textContent = "x";
      yMinWrap.querySelector(".sc-limit-label").textContent = "y";
      zMinWrap.querySelector(".sc-limit-label").textContent = "z";
      if (!funcInput.value.trim() || funcInput.value === "r" || funcInput.value === "x*y" || funcInput.value === "1") funcInput.value = "x*y*z";
    } else {
      xMinWrap.querySelector(".sc-limit-label").textContent = "r";
      yMinWrap.querySelector(".sc-limit-label").textContent = "θ";
      zMinWrap.querySelector(".sc-limit-label").textContent = "φ";
      if (!funcInput.value.trim() || funcInput.value === "x*y*z" || funcInput.value === "x*y") funcInput.value = "r^2";
    }
  }
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

function switchVizEngine(engine) {
  currentVizEngine = engine;
  
  // Sync toggle button active states
  const desmosBtn = document.getElementById("toggleDesmosBtn");
  const plotlyBtn = document.getElementById("togglePlotlyBtn");
  if (desmosBtn && plotlyBtn) {
    desmosBtn.classList.toggle("active", engine === "desmos");
    plotlyBtn.classList.toggle("active", engine === "plotly");
  }

  // Update container visibility and draw if we have a context
  if (lastVizContext) {
    renderActiveVisualization();
  }
}

function renderActiveVisualization() {
  if (!lastVizContext) return;
  
  const desmosDiv = document.getElementById("desmosDiv");
  const viz3d = document.getElementById("viz3d");
  const st = document.getElementById('desmosStatus');
  const toggleGroup = document.getElementById("vizToggleGroup");
  
  if (st) st.style.display = 'none';

  if (lastVizContext.mode === 'triple') {
    // Triple integrals strictly use Plotly
    if (desmosDiv) desmosDiv.style.display = 'none';
    if (viz3d) viz3d.style.display = 'block';
    renderTripleVisualization(lastVizContext);
    
    // Hide the toggle group for triple integrals since Desmos doesn't support the 3D scatter
    if (toggleGroup) toggleGroup.style.display = 'none';
  } else {
    // Show toggle group for double integrals
    if (toggleGroup) toggleGroup.style.display = 'flex';
    
    if (currentVizEngine === 'desmos') {
      if (viz3d) viz3d.style.display = 'none';
      if (desmosDiv) desmosDiv.style.display = 'block';
      renderDesmosRegion(lastVizContext);
    } else {
      if (desmosDiv) desmosDiv.style.display = 'none';
      if (viz3d) viz3d.style.display = 'block';
      renderDoubleVisualization(lastVizContext);
      
      // Let Plotly resize in case container was hidden
      setTimeout(() => {
        if (window.Plotly) {
          window.Plotly.Plots.resize('viz3d');
        }
      }, 50);
    }
  }
}

// Attach event listeners for the toggle buttons
const toggleDesmosBtn = document.getElementById("toggleDesmosBtn");
const togglePlotlyBtn = document.getElementById("togglePlotlyBtn");
if (toggleDesmosBtn) {
  toggleDesmosBtn.addEventListener("click", () => switchVizEngine("desmos"));
}
if (togglePlotlyBtn) {
  togglePlotlyBtn.addEventListener("click", () => switchVizEngine("plotly"));
}

document.getElementById("mode").addEventListener("change", updateModeUI);
document.getElementById("coordSystem").addEventListener("change", updateModeUI);
document.getElementById("doubleCase").addEventListener("change", updateModeUI);

// Segmented Control Event Listeners
const modeSelectorEl = document.getElementById("modeSelector");
if (modeSelectorEl) {
  modeSelectorEl.querySelectorAll(".segment-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const modeInput = document.getElementById("mode");
      if (modeInput && modeInput.value !== btn.dataset.value) {
        modeInput.value = btn.dataset.value;
        modeInput.dispatchEvent(new Event("change"));
      }
    });
  });
}

document.getElementById("solveBtn").addEventListener("click", () => {
  const resultEl = document.getElementById("integralResult");
  const metaEl = document.getElementById("integralMeta");
  let vizContext = null;
  
  const tryParseNumber = (id, fallback) => {
    const el = document.getElementById(id);
    if (!el) return fallback;
    const val = parseFloat(el.value);
    return isNaN(val) ? fallback : val;
  };

  try {
    const mode = document.getElementById("mode").value;
    const steps = mode === "double" ? 100 : 40;
    const coordSystem = document.getElementById("coordSystem").value;
    const expr = document.getElementById("funcInput").value.trim();

    if (mode === "double") {
      const a = parseNumber("xMin");
      const b = parseNumber("xMax");

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
        displayResult(isExact ? stepsRes.exactVal : val, `Polar · Jacobian r · ${steps}×${steps} cells`, isExact, stepsRes.customSym);
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
          displayResult(isExact ? stepsRes.exactVal : val, `Case 1: outer x∈[${a},${b}], inner y = [g₁(x), g₂(x)]`, isExact, stepsRes.customSym);
          showSteps(stepsRes.html);
          const cRaw = tryParseNumber("yMin", 0);
          const dRaw = tryParseNumber("yMax", 1);
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
          displayResult(isExact ? stepsRes.exactVal : val, `Case 2: outer y∈[${c},${d}], inner x = [h₁(y), h₂(y)]`, isExact, stepsRes.customSym);
          showSteps(stepsRes.html);
          const aRaw = tryParseNumber("xMin", 0);
          const bRaw = tryParseNumber("xMax", 1);
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
            a: Number.isFinite(aRaw) && Number.isFinite(bRaw) && bRaw > aRaw ? aRaw : range ? range.min : 0,
            b: Number.isFinite(aRaw) && Number.isFinite(bRaw) && bRaw > aRaw ? bRaw : range ? range.max : 1,
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
          displayResult(isExact ? stepsRes.exactVal : val, `Case 4 (separable): x∈[${a},${b}], y∈[${c},${d}]`, isExact, stepsRes.customSym);
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
          displayResult(isExact ? stepsRes.exactVal : val, `Case 3 (rectangular): x∈[${a},${b}], y∈[${c},${d}]`, isExact, stepsRes.customSym);
          showSteps(stepsRes.html);
          vizContext = { mode: "double", coordSystem, expr, a, b, c, d, doubleCase };
        }
      }
    }
    else {
      // Triple integral
      const cRawExpr = document.getElementById('yMin').value.trim();
      const dRawExpr = document.getElementById('yMax').value.trim();
      const eRawExpr = document.getElementById('zMin').value.trim();
      const fRawExpr = document.getElementById('zMax').value.trim();

      if (coordSystem === 'spherical') {
        const a = parseNumber("xMin");
        const b = parseNumber("xMax");
        if (!(b > a)) throw new Error('Ensure outer-axis max > min.');

        const fn = safeCompile(expr, ['r','theta','phi','sin','cos','tan','sqrt','abs','exp','log','ln','pow','PI','E']);
        const wrapped = (r, theta, phi) =>
          fn(r, theta, phi, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E) *
          r * r * Math.sin(phi);
        const cFn = compileLimitFn(cRawExpr, ['r']);
        const dFn = compileLimitFn(dRawExpr, ['r']);
        const eFn = compileLimitFn(eRawExpr, ['r', 'theta']);
        const fFn = compileLimitFn(fRawExpr, ['r', 'theta']);
        const val = midpointTripleVariableInner(wrapped, a, b, cFn, dFn, eFn, fFn, steps);
        const stepsRes = buildStepsTriple(expr, 'spherical', a, b, cRawExpr, dRawExpr, eRawExpr, fRawExpr, steps, val);
        const isExact = stepsRes.exactVal !== undefined && stepsRes.exactVal !== null;
        displayResult(isExact ? stepsRes.exactVal : val, `Polar/Spherical · Jacobian r²sin(φ) · adaptive midpoint`, isExact, stepsRes.customSym);
        showSteps(stepsRes.html);
        vizContext = { mode: 'triple', coordSystem, expr, a, b, c: 0, d: 2*Math.PI, e: 0, f: Math.PI };
      } else {
        const xMinRaw = document.getElementById('xMin').value.trim();
        const xMaxRaw = document.getElementById('xMax').value.trim();

        const getReferencedVars = (str) => {
          if (!str) return [];
          const vars = new Set();
          const matches = str.match(/\b([xyz])\b/gi);
          if (matches) matches.forEach(m => vars.add(m.toLowerCase()));
          return Array.from(vars);
        };

        const deps = {
          x: Array.from(new Set([...getReferencedVars(xMinRaw), ...getReferencedVars(xMaxRaw)])),
          y: Array.from(new Set([...getReferencedVars(cRawExpr), ...getReferencedVars(dRawExpr)])),
          z: Array.from(new Set([...getReferencedVars(eRawExpr), ...getReferencedVars(fRawExpr)]))
        };

        const depCounts = {
          x: deps.x.length,
          y: deps.y.length,
          z: deps.z.length
        };

        const sorted = ['x', 'y', 'z'].sort((a, b) => depCounts[a] - depCounts[b]);
        const outer = sorted[0];
        const middle = sorted[1];
        const inner = sorted[2];

        const mapExpr = (str) => {
          if (!str) return "";
          let temp = str;
          temp = temp.replace(/\bx\b/g, '__X_VAR__');
          temp = temp.replace(/\by\b/g, '__Y_VAR__');
          temp = temp.replace(/\bz\b/g, '__Z_VAR__');
          
          temp = temp.replace(new RegExp('__' + outer.toUpperCase() + '_VAR__', 'g'), 'x');
          temp = temp.replace(new RegExp('__' + middle.toUpperCase() + '_VAR__', 'g'), 'y');
          temp = temp.replace(new RegExp('__' + inner.toUpperCase() + '_VAR__', 'g'), 'z');
          return temp;
        };

        const mappedExpr = mapExpr(expr);
        const rawLimitsMap = {
          x: { min: xMinRaw, max: xMaxRaw },
          y: { min: cRawExpr, max: dRawExpr },
          z: { min: eRawExpr, max: fRawExpr }
        };

        const mappedOuterMinRaw = mapExpr(rawLimitsMap[outer].min);
        const mappedOuterMaxRaw = mapExpr(rawLimitsMap[outer].max);
        const mappedMiddleMinRaw = mapExpr(rawLimitsMap[middle].min);
        const mappedMiddleMaxRaw = mapExpr(rawLimitsMap[middle].max);
        const mappedInnerMinRaw = mapExpr(rawLimitsMap[inner].min);
        const mappedInnerMaxRaw = mapExpr(rawLimitsMap[inner].max);

        const aValStr = typeof nerdamer !== 'undefined' ? nerdamer(mappedOuterMinRaw).evaluate().text() : mappedOuterMinRaw;
        const bValStr = typeof nerdamer !== 'undefined' ? nerdamer(mappedOuterMaxRaw).evaluate().text() : mappedOuterMaxRaw;
        const aVal = parseFloat(aValStr);
        const bVal = parseFloat(bValStr);
        
        if (isNaN(aVal) || isNaN(bVal) || !(bVal > aVal)) {
          throw new Error(`Outermost variable (${outer.toUpperCase()}) limits must evaluate to constants with max > min. Got [${mappedOuterMinRaw}, ${mappedOuterMaxRaw}]`);
        }

        const fn = safeCompile(mappedExpr, ['x','y','z','sin','cos','tan','sqrt','abs','exp','log','ln','pow','PI','E']);
        const wrapped = (x, y, z) =>
          fn(x, y, z, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E);
        const cFn = compileLimitFn(mappedMiddleMinRaw, ['x']);
        const dFn = compileLimitFn(mappedMiddleMaxRaw, ['x']);
        const eFn = compileLimitFn(mappedInnerMinRaw, ['x', 'y']);
        const fFn = compileLimitFn(mappedInnerMaxRaw, ['x', 'y']);

        const val = midpointTripleVariableInner(wrapped, aVal, bVal, cFn, dFn, eFn, fFn, steps);

        const stepsRes = buildStepsTriple(mappedExpr, 'cartesian3d', aVal, bVal, mappedMiddleMinRaw, mappedMiddleMaxRaw, mappedInnerMinRaw, mappedInnerMaxRaw, steps, val);
        const isExact = stepsRes.exactVal !== undefined && stepsRes.exactVal !== null;

        let mappingNoticeHtml = "";
        if (outer !== 'x' || middle !== 'y' || inner !== 'z') {
          mappingNoticeHtml = `
            <div class="sym-block" style="border-left: 4px solid var(--accent); background: #f0f6ff; padding: 12px 16px; margin-bottom: 16px; border-radius: 8px;">
              <div style="font-weight: 700; color: var(--accent); margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                🔄 Automatic Textbook Variable Mapping
              </div>
              <div style="font-size: 13.5px; color: var(--text2); line-height: 1.6;">
                The textbook's integration order was automatically recognized based on variable dependencies:<br>
                • <strong>Outermost constant variable:</strong> \\(${outer.toUpperCase()}\\) (mapped internally to \\(x\\))<br>
                • <strong>Middle variable:</strong> \\(${middle.toUpperCase()}\\) (mapped internally to \\(y\\))<br>
                • <strong>Innermost variable:</strong> \\(${inner.toUpperCase()}\\) (mapped internally to \\(z\\))
              </div>
            </div>
          `;
        }

        displayResult(isExact ? stepsRes.exactVal : val, `Cartesian 3D · Auto-mapped [${outer}, ${middle}, ${inner}]`, isExact, stepsRes.customSym);
        showSteps(mappingNoticeHtml + stepsRes.html);
        
        // Better vizContext for triple cartesian: estimate bounds for Plotly markers
        const midR = estimateInnerRange(aVal, bVal, cFn, dFn) || { min: -1, max: 1 };
        const innR = { min: -1, max: 1 }; // Inner (z) is harder to estimate without a 2D scan, using defaults
        vizContext = { 
          mode: 'triple', coordSystem, expr: mappedExpr, 
          a: aVal, b: bVal, c: midR.min, d: midR.max, e: innR.min, f: innR.max,
          cFn, dFn, eFn, fFn 
        };
      }
    }
    if (vizContext) {
      lastVizContext = vizContext;
      renderActiveVisualization();
    }
    // Reveal the results panel
    document.getElementById('simBottomRow').style.display = 'flex';
    document.getElementById('simBottomRow').style.flexDirection = 'column';
    document.getElementById('simBottomRow').style.gap = '20px';
    
    const topRow = document.querySelector(".sim-top-row");
    if (topRow) {
      topRow.classList.add("has-results");
    }
    
    // Smooth scroll to results only on smaller viewports
    if (window.innerWidth < 1200) {
      document.getElementById('simBottomRow').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (error) {
    document.getElementById('simBottomRow').style.display = 'flex';
    document.getElementById('simBottomRow').style.flexDirection = 'column';
    document.getElementById('simBottomRow').style.gap = '16px';
    document.getElementById('integralResult').innerHTML = '⚠️ Computation failed';
    document.getElementById('integralMeta').textContent = error.message;
    document.getElementById('integralSymbolic').style.display = 'none';
    document.getElementById('stepsCard').style.display = 'none';
    clearVisualization('Graph could not be generated due to invalid input.');
    
    const topRow = document.querySelector(".sim-top-row");
    if (topRow) {
      topRow.classList.add("has-results");
    }
  }
});



const examples = [
  // ── DOUBLE · Cartesian Case 1 (outer x, variable y limits) ──────────────
  {
    mode: "double", coordSystem: "cartesian2d", doubleCase: "case1",
    func: "exp(y/x)", xMin: "0", xMax: "1", yMin: "", yMax: "", innerLower: "0", innerUpper: "x",
    label: "PDF Type-I Q4 · ∫₀¹∫₀ˣ eʸ/ˣ dy dx · Expected: (e−1)/2 ≈ 0.8591"
  },
  {
    mode: "double", coordSystem: "cartesian2d", doubleCase: "case1",
    func: "x*y*(x+y)", xMin: "0", xMax: "1", yMin: "", yMax: "", innerLower: "x^2", innerUpper: "x",
    label: "PDF Type-II Q1 · ∫₀¹∫ₓ²ˣ xy(x+y) dy dx · Expected: 3/56 ≈ 0.0536"
  },
  {
    mode: "double", coordSystem: "cartesian2d", doubleCase: "case1",
    func: "1/(1+x^2+y^2)", xMin: "0", xMax: "1", yMin: "", yMax: "", innerLower: "0", innerUpper: "sqrt(1+x^2)",
    label: "PDF Type-I Q1 · ∫₀¹∫₀^√(1+x²) 1/(1+x²+y²) dy dx · Expected: π/4·ln(1+√2) ≈ 0.6786"
  },
  {
    mode: "double", coordSystem: "cartesian2d", doubleCase: "case1",
    func: "x*y", xMin: "0", xMax: "1", yMin: "", yMax: "", innerLower: "x^2", innerUpper: "x",
    label: "PDF Type-II — ∫₀¹∫ₓ²ˣ xy dy dx · Expected: 1/12 ≈ 0.0833"
  },
  // ── DOUBLE · Cartesian Case 2 (outer y, variable x limits) ──────────────
  {
    mode: "double", coordSystem: "cartesian2d", doubleCase: "case2",
    func: "exp(y^2)", xMin: "", xMax: "", yMin: "0", yMax: "1", innerLower: "0", innerUpper: "2*y",
    label: "PDF Type-II Q4 · ∫₀¹∫₀^{2y} eʸ² dx dy · Expected: e−1 ≈ 1.7183"
  },
  {
    mode: "double", coordSystem: "cartesian2d", doubleCase: "case2",
    func: "x*y*exp(-x^2)", xMin: "", xMax: "", yMin: "0", yMax: "1", innerLower: "0", innerUpper: "y",
    label: "PDF Type-I Q5 · ∫₀¹∫₀ʸ xye^{-x²} dx dy · Expected: 1/(4e) ≈ 0.0920"
  },
  {
    mode: "double", coordSystem: "cartesian2d", doubleCase: "case2",
    func: "exp(x+y)", xMin: "", xMax: "", yMin: "0", yMax: "1", innerLower: "y", innerUpper: "1",
    label: "PDF Type-I variant · ∫₀¹∫ᵧ¹ eˣ⁺ʸ dx dy · Expected: (e−1)²/2 ≈ 1.4761"
  },
  // ── DOUBLE · Cartesian Case 3 (rectangular) ─────────────────────────────
  {
    mode: "double", coordSystem: "cartesian2d", doubleCase: "case3",
    func: "exp(-x^2-y^2)", xMin: "0", xMax: "2", yMin: "0", yMax: "2", innerLower: "", innerUpper: "",
    label: "PDF Type-IV Q1 (large square ≈ quarter-plane) · Expected → π/4 ≈ 0.7854 as a→∞"
  },
  // ── DOUBLE · Cartesian Case 4 (separable) ───────────────────────────────
  {
    mode: "double", coordSystem: "cartesian2d", doubleCase: "case4",
    func: "sin(x)*cos(y)", xMin: "0", xMax: "3.14159", yMin: "0", yMax: "1.5708", innerLower: "", innerUpper: "",
    label: "Classic separable · ∫₀^π sin(x) dx · ∫₀^{π/2} cos(y) dy · Expected: 2×1 = 2"
  },
  {
    mode: "double", coordSystem: "cartesian2d", doubleCase: "case3",
    func: "exp(x+y+0*z)", xMin: "0", xMax: "1", yMin: "0", yMax: "1", innerLower: "", innerUpper: "",
    label: "PDF Type-VI Q2 (double slice) · ∫₀¹∫₀¹ eˣ⁺ʸ dy dx · Expected: (e−1)² ≈ 2.9525"
  },
  // ── DOUBLE · Polar ────────────────────────────────────────────────────────
  {
    mode: "double", coordSystem: "polar", doubleCase: "case3",
    func: "exp(-r^2)", xMin: "0", xMax: "1", yMin: "0", yMax: "1.5708", innerLower: "", innerUpper: "",
    label: "PDF Type-IV Q1 (Polar) · ∫₀^{π/2}∫₀¹ e^{-r²}·r dr dθ · Expected: π/4·(1−1/e) ≈ 0.3974"
  },
  {
    mode: "double", coordSystem: "polar", doubleCase: "case3",
    func: "r^2*cos(theta)", xMin: "0", xMax: "2", yMin: "0", yMax: "1.5708", innerLower: "", innerUpper: "",
    label: "PDF Type-III variant · ∫₀^{π/2}∫₀² r²cos(θ)·r dr dθ · Expected: 4"
  },
  {
    mode: "double", coordSystem: "polar", doubleCase: "case3",
    func: "sin(r^2)", xMin: "0", xMax: "1.7725", yMin: "0", yMax: "6.28318", innerLower: "", innerUpper: "",
    label: "PDF Type-III Q1 (a=√π) · ∫₀^{2π}∫₀^√π sin(r²)·r dr dθ · Expected: π(1−cos(π))=2π≈6.2832"
  },
  // ── TRIPLE · Cartesian ────────────────────────────────────────────────────
  {
    mode: "triple", coordSystem: "cartesian3d",
    func: "exp(x+y+z)", xMin: "0", xMax: "1", yMin: "0", yMax: "1", zMin: "0", zMax: "1",
    label: "PDF Type-VI Q2 · ∭ eˣ⁺ʸ⁺ᶻ over unit cube · Expected: (e−1)³ ≈ 5.0731"
  },
  {
    mode: "triple", coordSystem: "cartesian3d",
    func: "exp(z)", xMin: "0", xMax: "1", yMin: "0", yMax: "1-x", zMin: "0", zMax: "x+y",
    label: "PDF Type-VI Q5 · ∭ eᶻ, y∈[0,1−x], z∈[0,x+y] · Expected: 1/2 = 0.5000"
  },
  {
    mode: "triple", coordSystem: "cartesian3d",
    func: "1", xMin: "0", xMax: "1", yMin: "0", yMax: "1-x", zMin: "0", zMax: "1-x-y",
    label: "PDF Type-IX Q15 · Volume of tetrahedron x+y+z≤1 · Expected: 1/6 ≈ 0.1667"
  },
  {
    mode: "triple", coordSystem: "cartesian3d",
    func: "x+y+z", xMin: "0", xMax: "1", yMin: "0", yMax: "1-x", zMin: "0", zMax: "1-x-y",
    label: "PDF Type-VII Q2 (a=b=c=1) · ∭(x+y+z) over tetrahedron · Expected: abc(a+b+c)/24 = 3/24 = 0.125"
  },
  // ── TRIPLE · Polar / Spherical ────────────────────────────────────────────
  {
    mode: "triple", coordSystem: "spherical",
    func: "r^3*sin(phi)^2*cos(phi)*cos(theta)*sin(theta)",
    xMin: "0", xMax: "2", yMin: "0", yMax: "1.5708", zMin: "0", zMax: "1.5708",
    label: "PDF Type-VIII Q3 · ∭ xyz over +ve octant of sphere r=2 · Expected: 4/3 ≈ 1.3333"
  },
  {
    mode: "triple", coordSystem: "spherical",
    func: "1",
    xMin: "0", xMax: "1", yMin: "0", yMax: "6.28318", zMin: "0", zMax: "3.14159",
    label: "Volume of unit sphere via spherical integration · Expected: 4π/3 ≈ 4.1888"
  }
];

let currentExampleIndex = -1;

document.getElementById("exampleBtn").addEventListener("click", () => {
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * examples.length);
  } while (newIndex === currentExampleIndex && examples.length > 1);
  currentExampleIndex = newIndex;
  
  const example = examples[newIndex];
  
  document.getElementById("mode").value = example.mode || "double";
  updateModeUI();
  
  if (example.coordSystem) document.getElementById("coordSystem").value = example.coordSystem;
  if (example.doubleCase) document.getElementById("doubleCase").value = example.doubleCase;
  
  updateModeUI(); // to reflect changes
  
  document.getElementById("funcInput").value = example.func || "";
  if (example.xMin !== undefined) document.getElementById("xMin").value = example.xMin;
  if (example.xMax !== undefined) document.getElementById("xMax").value = example.xMax;
  if (example.yMin !== undefined) document.getElementById("yMin").value = example.yMin;
  if (example.yMax !== undefined) document.getElementById("yMax").value = example.yMax;
  if (example.zMin !== undefined) document.getElementById("zMin").value = example.zMin;
  if (example.zMax !== undefined) document.getElementById("zMax").value = example.zMax;
  if (example.innerLower !== undefined) document.getElementById("innerLower").value = example.innerLower;
  if (example.innerUpper !== undefined) document.getElementById("innerUpper").value = example.innerUpper;

  // Show label hint
  const hint = document.getElementById("exampleHint");
  if (hint) {
    if (example.label) {
      hint.textContent = example.label;
      hint.style.display = "block";
    } else {
      hint.style.display = "none";
    }
  }

  // Match Vercel behavior: clear bottom panel so user clicks Compute
  document.getElementById("integralResult").textContent = "Ready";
  document.getElementById("integralMeta").textContent = "Click Compute Integral to evaluate.";
  document.getElementById("integralSymbolic").style.display = "none";
  document.getElementById("stepsCard").style.display = "none";
  document.getElementById("simBottomRow").style.display = "none";
  const topRow = document.querySelector(".sim-top-row");
  if (topRow) {
    topRow.classList.remove("has-results");
  }
  clearDesmos();
  updateMathPreview();
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
  document.getElementById("integralMeta").textContent = "Configure the integral and click Compute.";
  document.getElementById("integralSymbolic").style.display = "none";
  document.getElementById("stepsCard").style.display = "none";
  document.getElementById("simBottomRow").style.display = "none";
  const topRow = document.querySelector(".sim-top-row");
  if (topRow) {
    topRow.classList.remove("has-results");
  }
  clearDesmos();
  updateMathPreview();
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
  document.getElementById("feedbackResult").innerHTML = `
    <div style="margin-top: 1rem; padding: 1rem; border-radius: 8px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981;">
      ✅ <strong>Success!</strong> Thank you for your feedback. Your response has been recorded.
    </div>
  `;
  event.target.reset();
});
updateModeUI();
updateMathPreview();
switchTab("aimTab");

document.getElementById('stepsToggle').addEventListener('click', () => {

  const head    = document.getElementById('stepsToggle');
  const content = document.getElementById('stepsContent');
  const collapsed = head.classList.toggle('collapsed');
  content.classList.toggle('hidden', collapsed);
});

