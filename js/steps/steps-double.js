import { buildDUISSteps } from './steps-duis.js';


export function _resultBlock(val, exactTeX, recognizeConstant) {
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

export function buildStepsDouble(expr, coordSystem, a, b, c, d, N, val, caseType, lowExpr, upExpr, safeCompile, jsToDesmos, recognizeConstant) {
  const dx = (b - a) / N, dy = (d - c) / N;

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
      return { html: innerHTML + _resultBlock(val, exactTeX, recognizeConstant), exactVal: exactVal, customSym: exactTeX };
    }

    let pfn; try { pfn = safeCompile(expr,['r','theta','sin','cos','tan','sqrt','abs','exp','log','ln','pow','PI','E']); } catch { pfn=null; }
    let rows=''; for(let i=0;i<2;i++) for(let j=0;j<2;j++){const r=a+(i+.5)*dx,th=c+(j+.5)*dy;const fv=pfn?pfn(r,th,Math.sin,Math.cos,Math.tan,Math.sqrt,Math.abs,Math.exp,Math.log,Math.log,Math.pow,Math.PI,Math.E):null;rows+=`<tr><td>${r.toFixed(4)}</td><td>${th.toFixed(4)}</td><td>${fv!==null?fv.toFixed(5):'—'}</td><td>${fv!==null?(fv*r).toFixed(5):'—'}</td></tr>`;}
    return {
      html: `<div class="step-block"><div class="step-block-title">Step 1 — Integral Setup (Polar)</div><div class="step-content">
      <div class="sym-block" style="text-align:center;">
        \\( \\displaystyle \\iint_R f(r,\\theta) \\, dA = \\int_{${c}}^{${d}} \\int_{${a}}^{${b}} f(r,\\theta) \\cdot r \\, dr \\, d\\theta \\)
      </div>
      <p style="margin-top:12px;">Domain: \\( r \\in [${a}, ${b}], \\theta \\in [${c}, ${d}] \\). <em>Jacobian \\( r \\) included automatically for polar coordinates.</em></p>
</div></div>
<div class="step-block"><div class="step-block-title">Step 2 — Partition (N=${N})</div><div class="step-content">Δr=${dx.toFixed(5)}, Δθ=${dy.toFixed(5)}, cells=${N*N}</div></div>
<div class="step-block"><div class="step-block-title">Step 3 — Midpoint Sum</div><div class="step-content">Result ≈ Σ f(rᵢ*,θⱼ*)·rᵢ*·Δr·Δθ<table class="steps-table" style="margin-top:6px"><thead><tr><th>r*</th><th>θ*</th><th>f</th><th>f·r*</th></tr></thead><tbody>${rows}</tbody></table></div></div>${_resultBlock(val, null, recognizeConstant)}`
    };
  }

  // Cartesian Cases
  if (caseType === 'case1') {
    const duisResult = buildDUISSteps(expr, 'y', lowExpr||'0', upExpr||'x', 'x', a, b);
    const duisHTML = duisResult ? duisResult.html : null;
    const exactTeX = duisResult ? duisResult.exactTeX : null;
    const exactVal = duisResult ? duisResult.exactVal : null;
    const customSym = duisResult ? duisResult.customSym : null;
    const genericSetup = (duisHTML && duisHTML.includes('Original Double Integral')) ? '' :
      `<div class="step-block"><div class="step-block-title">Step 1 — Setup (Case 1)</div><div class="step-content">
      <div class="sym-block" style="text-align:center;">
        \\( \\displaystyle \\iint_R f(x,y) \\, dA = \\int_{${a}}^{${b}} \\int_{${jsToDesmos(lowExpr)}}^ {${jsToDesmos(upExpr)}} f(x,y) \\, dy \\, dx \\)
      </div>
      <p style="margin-top:12px;">Outer: \\( x \\in [${a}, ${b}] \\) (constant) &nbsp;|&nbsp; Inner: \\( y \\) from \\( ${jsToDesmos(lowExpr)} \\) to \\( ${jsToDesmos(upExpr)} \\)</p>
</div></div>`;
    return { html: `${genericSetup}${duisHTML || '<em>Symbolic steps could not be generated for this expression. Evaluated numerically.</em>'}${_resultBlock(val, exactTeX, recognizeConstant)}`, exactVal, customSym };
  }

  if (caseType === 'case2') {
    const duisResult = buildDUISSteps(expr, 'x', lowExpr||'0', upExpr||'y', 'y', c, d);
    const duisHTML = duisResult ? duisResult.html : null;
    const exactTeX = duisResult ? duisResult.exactTeX : null;
    const exactVal = duisResult ? duisResult.exactVal : null;
    const customSym = duisResult ? duisResult.customSym : null;
    return { html: `<div class="step-block"><div class="step-block-title">Step 1 — Setup (Case 2)</div><div class="step-content">
      <div class="sym-block" style="text-align:center;">
        \\( \\displaystyle \\iint_R f(x,y) \\, dA = \\int_{${c}}^{${d}} \\int_{${jsToDesmos(lowExpr)}}^{${jsToDesmos(upExpr)}} f(x,y) \\, dx \\, dy \\)
      </div>
      <p style="margin-top:12px;">Outer: \\( y \\in [${c}, ${d}] \\) (constant) &nbsp;|&nbsp; Inner: \\( x \\) from \\( ${jsToDesmos(lowExpr)} \\) to \\( ${jsToDesmos(upExpr)} \\)</p>
</div></div>${duisHTML || '<em>Symbolic steps could not be generated for this expression. Evaluated numerically.</em>'}${_resultBlock(val, exactTeX, recognizeConstant)}`, exactVal, customSym };
  }

  if (caseType === 'case4') {
    const duisResult = buildDUISSteps(expr, 'y', c, d, 'x', a, b);
    const duisHTML = duisResult ? duisResult.html : null;
    const exactTeX = duisResult ? duisResult.exactTeX : null;
    const exactVal = duisResult ? duisResult.exactVal : null;
    const customSym = duisResult ? duisResult.customSym : null;
    return { html: `<div class="step-block"><div class="step-block-title">Step 1 — Separable Form (Case 4)</div><div class="step-content">
      <div class="sym-block" style="text-align:center;">
        \\( \\displaystyle f(x,y) = X(x) \\cdot Y(y) \\implies \\iint_R f \\, dA = \\left[ \\int_{${a}}^{${b}} X(x) \\, dx \\right] \\times \\left[ \\int_{${c}}^{${d}} Y(y) \\, dy \\right] \\)
      </div>
      <p style="margin-top:12px;">Both limits are constant → integral separates into two independent 1D integrals.</p>
</div></div>${duisHTML || '<em>Symbolic steps could not be generated for this expression. Evaluated numerically.</em>'}${_resultBlock(val, exactTeX, recognizeConstant)}`, exactVal, customSym };
  }

  // Case 3 (Rectangular)
  const duisResult = buildDUISSteps(expr, 'y', c, d, 'x', a, b);
  const duisHTML = duisResult ? duisResult.html : null;
  const exactTeX = duisResult ? duisResult.exactTeX : null;
  const exactVal = duisResult ? duisResult.exactVal : null;
  const customSym = duisResult ? duisResult.customSym : null;
  return { html: `<div class="step-block"><div class="step-block-title">Step 1 — Setup (Case 3)</div><div class="step-content">
      <div class="sym-block" style="text-align:center;">
        \\( \\displaystyle \\iint_R f(x,y) \\, dA = \\int_{${a}}^{${b}} \\int_{${c}}^{${d}} f(x,y) \\, dy \\, dx \\)
      </div>
      <p style="margin-top:12px;">Both limits are constant → order can be reversed (Fubini's theorem).</p>
      <p>Chosen order: integrate <strong>wrt y first</strong> (inner), then <strong>wrt x</strong> (outer).</p>
</div></div>${duisHTML || '<em>Symbolic steps could not be generated for this expression. Evaluated numerically.</em>'}${_resultBlock(val, exactTeX, recognizeConstant)}`, exactVal, customSym };
}
