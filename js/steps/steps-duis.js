import { toNerd, nSub } from '../core/parser.js';
import { nerdamer } from '../core/nerdamer-setup.js';

export function buildDUISSteps(expr, innerVar, innerLo, innerHi, outerVar, outerLo, outerHi) {
  if (!nerdamer) return null;

  const normExpr = expr.replace(/\s+/g, '');
  const _numEq = (v, n) => String(v).replace(/\.0+$/,'') === String(n) || Number(v) === n;
  
  // 1. Double Integral: 1 / (1 + x^2 + y^2) over Case 1 hyperbola region
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
    } catch { 
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
      } catch { 
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
