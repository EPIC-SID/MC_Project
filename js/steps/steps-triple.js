import { nerdamer } from '../core/nerdamer-setup.js';
import { toNerd, nSub, jsToDesmos } from '../core/parser.js';

export function buildStepsTriple(expr, coordSystem, a, b, cExpr, dExpr, eExpr, fExpr, N, val, recognizeConstant, safeCompile, midpointTripleVariableInner, estimateInnerRange) {
  const recognized = recognizeConstant(val);
  const displayVal = recognized ? recognized.val : val;
  const isExact = !!recognized;

  const axes = { cartesian3d: ['x','y','z'], spherical: ['r','theta','phi'] };
  const texAxes = { cartesian3d: ['x','y','z'], spherical: ['r','\\theta','\\phi'] };
  const [v1, v2, v3] = axes[coordSystem] || ['x','y','z'];
  const [t1, t2, t3] = texAxes[coordSystem] || ['x','y','z'];

  let finalExpr = expr;
  if (coordSystem === 'spherical') {
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
    if (!nerdamer) throw new Error('Nerdamer not loaded');

    const nExpr = toNerd(finalExpr);
    const exprTex = nerdamer(nExpr).toTeX();
    const v3HiTex = nerdamer(toNerd(fExpr)).toTeX();
    const v3LoTex = nerdamer(toNerd(eExpr)).toTeX();

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
