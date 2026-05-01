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
  const sign = val < 0 ? '−' : '';
  if (abs < 1e-9) return '0';
  const tol = 1.5e-4;

  // Pure fractions n/d
  for (let d = 1; d <= 20; d++) {
    for (let n = 1; n <= 20 * d; n++) {
      const c = n / d;
      if (Math.abs(abs - c) / c < tol) {
        const g = gcd(n, d); const sn = n/g, sd = d/g;
        return sign + (sd === 1 ? `${sn}` : `${sn}/${sd}`);
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
    for (let d = 1; d <= 12; d++) {
      for (let n = 1; n <= 8 * d; n++) {
        const c = (n / d) * base.v;
        if (Math.abs(abs - c) / c < tol) {
          const g = gcd(n, d); const sn = n/g, sd = d/g;
          let sym;
          if (sd === 1 && sn === 1) sym = base.sym;
          else if (sd === 1) sym = `${sn}${base.sym}`;
          else if (sn === 1) sym = `${base.sym}/${sd}`;
          else sym = `${sn}${base.sym}/${sd}`;
          return sign + sym;
        }
      }
    }
  }
  return null;
}

/* ── Display result with symbolic form ─────────── */
function displayResult(val, metaText) {
  const resultEl = document.getElementById('integralResult');
  const metaEl   = document.getElementById('integralMeta');
  const symWrap  = document.getElementById('integralSymbolic');
  const symVal   = document.getElementById('integralSymVal');

  resultEl.textContent = `≈ ${val.toFixed(8)}`;
  metaEl.textContent   = metaText;

  const sym = recognizeConstant(val);
  if (sym) {
    symVal.textContent = sym;
    symWrap.style.display = 'block';
  } else {
    symWrap.style.display = 'none';
  }
}

/* ── Build steps HTML for double integral ──────── */
function buildStepsDouble(expr, coordSystem, a, b, c, d, N, val, caseNote) {
  const dx = (b - a) / N, dy = (d - c) / N;
  const sym = recognizeConstant(val);
  const ax  = coordSystem === 'polar' ? 'r' : 'x';
  const ay  = coordSystem === 'polar' ? 'θ' : 'y';
  const jac = coordSystem === 'polar' ? '<em>Jacobian r multiplied automatically.</em>' : '';

  // Sample evaluations (4 cells)
  let sampleRows = '';
  const fnVars = coordSystem === 'polar'
    ? ['r','theta','sin','cos','tan','sqrt','abs','exp','log','ln','pow','PI','E']
    : ['x','y','sin','cos','tan','sqrt','abs','exp','log','ln','pow','PI','E'];
  let fn;
  try { fn = safeCompile(expr, fnVars); } catch { fn = null; }

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const xi = a + (i + 0.5) * dx;
      const yi = c + (j + 0.5) * dy;
      let fv = '—';
      if (fn) {
        try {
          const raw = fn(xi, yi, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E);
          fv = Number.isFinite(raw) ? raw.toFixed(6) : '—';
        } catch {}
      }
      sampleRows += `<tr><td>${xi.toFixed(4)}</td><td>${yi.toFixed(4)}</td><td>${fv}</td></tr>`;
    }
  }

  return `
  <div class="step-block">
    <div class="step-block-title">Step 1 — Integral Setup</div>
    <div class="step-content">
      ∬ (${expr}) d${ax}d${ay}<br>
      ${ax} ∈ [${a}, ${b}],  ${ay} ∈ [${c}, ${d}]<br>
      ${jac}${caseNote ? `<em>${caseNote}</em>` : ''}
    </div>
  </div>
  <div class="step-block">
    <div class="step-block-title">Step 2 — Partition  (N = ${N} per axis)</div>
    <div class="step-content">
      Δ${ax} = (${b} − ${a}) / ${N} = <strong>${dx.toFixed(6)}</strong><br>
      Δ${ay} = (${d} − ${c}) / ${N} = <strong>${dy.toFixed(6)}</strong><br>
      Total cells = ${N} × ${N} = ${N * N}
    </div>
  </div>
  <div class="step-block">
    <div class="step-block-title">Step 3 — Midpoint Rule</div>
    <div class="step-content">
      ${ax}ᵢ* = ${a} + (i + 0.5) · Δ${ax}<br>
      ${ay}ⱼ* = ${c} + (j + 0.5) · Δ${ay}<br>
      Result ≈ Σᵢ Σⱼ f(${ax}ᵢ*, ${ay}ⱼ*) · Δ${ax} · Δ${ay}
    </div>
  </div>
  <div class="step-block">
    <div class="step-block-title">Step 4 — Sample Evaluations (4 of ${N*N})</div>
    <div class="step-content">
      <table class="steps-table">
        <thead><tr><th>${ax}*</th><th>${ay}*</th><th>f(${ax}*,${ay}*)</th></tr></thead>
        <tbody>${sampleRows}</tbody>
      </table>
    </div>
  </div>
  <div class="step-block">
    <div class="step-block-title">Step 5 — Final Result</div>
    <div class="step-content">
      <div class="step-final-val">≈ ${val.toFixed(8)}</div>
      ${sym ? `<div class="step-symbolic-val">= ${sym}</div>` : '<em>No common symbolic form recognised.</em>'}
    </div>
  </div>`;
}

/* ── Build steps HTML for triple integral ──────── */
function buildStepsTriple(expr, coordSystem, a, b, c, d, e, f, N, val) {
  const dx = (b-a)/N, dy = (d-c)/N, dz = (f-e)/N;
  const sym = recognizeConstant(val);
  const axes = { cartesian3d:['x','y','z'], cylindrical:['r','θ','z'], spherical:['ρ','φ','θ'] };
  const [a1,a2,a3] = axes[coordSystem] || ['x','y','z'];
  const jac = coordSystem==='cylindrical' ? '<em>Jacobian r applied automatically.</em>'
            : coordSystem==='spherical'   ? '<em>Jacobian ρ²sin(φ) applied automatically.</em>'
            : '';
  return `
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
      <div class="step-final-val">≈ ${val.toFixed(8)}</div>
      ${sym ? `<div class="step-symbolic-val">= ${sym}</div>` : '<em>No common symbolic form recognised.</em>'}
    </div>
  </div>`;
}

/* ── Show / toggle steps card ──────────────────── */
function showSteps(html) {
  const card    = document.getElementById('stepsCard');
  const content = document.getElementById('stepsContent');
  card.style.display = 'block';
  content.innerHTML  = html;
  content.classList.remove('hidden');
  document.getElementById('stepsToggle').classList.remove('collapsed');
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
    if (!(innerMax > innerMin)) {
      throw new Error("Inner upper limit must be greater than inner lower limit throughout the outer interval.");
    }
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
  const answers = new FormData(form);
  let total = 0;
  let count = 0;
  for (const [, value] of answers.entries()) {
    total += Number(value);
    count += 1;
  }
  const el = document.getElementById(outputId);
  el.classList.remove('hidden');
  if (count === 0) {
    el.textContent = "Please answer all questions.";
    return;
  }
  const pct = Math.round((total / count) * 100);
  const emoji = pct === 100 ? '🏆' : pct >= 66 ? '✅' : pct >= 33 ? '⚠️' : '❌';
  el.innerHTML = `${emoji} Score: <strong>${total} / ${count}</strong> &nbsp;·&nbsp; ${pct}% correct`;
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
  window.Plotly.newPlot(
    "viz3d",
    [{ type: "surface", x: xVals, y: yVals, z: zGrid, colorscale: "Blues" }],
    {
      title,
      paper_bgcolor: '#ffffff', plot_bgcolor: '#f8fbff',
      font: { color: '#4a6080', size: 11 },
      margin: { l: 0, r: 0, b: 0, t: 36 },
      scene: {
        xaxis: { title: "X", gridcolor: '#dce6f0', zerolinecolor: '#b3d4f5' },
        yaxis: { title: "Y", gridcolor: '#dce6f0', zerolinecolor: '#b3d4f5' },
        zaxis: { title: "f", gridcolor: '#dce6f0', zerolinecolor: '#b3d4f5' },
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
        const z = fn(r, theta, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log);
        xRow.push(x);
        yRow.push(y);
        zRow.push(Number.isFinite(z) ? z : null);
      }
      xGrid.push(xRow);
      yGrid.push(yRow);
      zGrid.push(zRow);
    }

    renderSurfacePlot("Double Integral Surface (Polar)", xGrid, yGrid, zGrid);
    setVizStatus("3D surface generated in Cartesian space from polar inputs.");
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
        const z = fn(x, y, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log);
        row.push(Number.isFinite(z) ? z : null);
      }
    }
    zGrid.push(row);
  }

  renderSurfacePlot("Double Integral Surface", xVals, yVals, zGrid);
  setVizStatus("3D function surface generated over the selected region.");
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
          const v = fn(x, y, z, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log);
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
    setVizStatus("3D point cloud generated for Cartesian volume.");
    return;
  }

  if (modeInfo.coordSystem === "cylindrical") {
    const fn = safeCompile(modeInfo.expr, ["r", "theta", "z", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
    for (const r of ax1) {
      for (const theta of ax2) {
        for (const z of ax3) {
          const x = r * Math.cos(theta);
          const y = r * Math.sin(theta);
          const v = fn(r, theta, z, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log);
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
    setVizStatus("3D point cloud generated from cylindrical coordinates.");
    return;
  }

  const fn = safeCompile(modeInfo.expr, ["rho", "phi", "theta", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
  for (const rho of ax1) {
    for (const phi of ax2) {
      for (const theta of ax3) {
        const x = rho * Math.sin(phi) * Math.cos(theta);
        const y = rho * Math.sin(phi) * Math.sin(theta);
        const z = rho * Math.cos(phi);
        const v = fn(rho, phi, theta, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log);
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
  setVizStatus("3D point cloud generated from spherical coordinates.");
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
  } else {
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
    const steps = 40;
    const mode = document.getElementById("mode").value;
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
        displayResult(val, `Polar · Jacobian r · ${steps}×${steps} cells`);
        showSteps(buildStepsDouble(expr, 'polar', a, b, c, d, steps, val, ''));
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
          displayResult(val, `Case 1: outer x∈[${a},${b}], inner y = [g₁(x), g₂(x)]`);
          showSteps(buildStepsDouble(expr, 'cartesian2d', a, b, 0, 1, steps, val, `y-limits: [${lowExpr}, ${upExpr}]`));
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
          displayResult(val, `Case 2: outer y∈[${c},${d}], inner x = [h₁(y), h₂(y)]`);
          showSteps(buildStepsDouble(expr, 'cartesian2d', 0, 1, c, d, steps, val, `x-limits: [${lowExpr}, ${upExpr}]`));
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
          };
        } else if (doubleCase === "case4") {
          const c = parseNumber("yMin");
          const d = parseNumber("yMax");
          if (!(b > a && d > c)) {
            throw new Error("Ensure x max > x min and y max > y min.");
          }
          const val = midpointDoubleIntegral(wrapped, a, b, c, d, steps);
          displayResult(val, `Case 4 (separable): x∈[${a},${b}], y∈[${c},${d}]`);
          showSteps(buildStepsDouble(expr, 'cartesian2d', a, b, c, d, steps, val, 'Separable f(x,y) = X(x)·Y(y)'));
          vizContext = { mode: "double", coordSystem, expr, a, b, c, d, doubleCase };
        } else {
          const c = parseNumber("yMin");
          const d = parseNumber("yMax");
          if (!(b > a && d > c)) {
            throw new Error("Ensure x max > x min and y max > y min.");
          }
          const val = midpointDoubleIntegral(wrapped, a, b, c, d, steps);
          displayResult(val, `Case 3 (rectangular): x∈[${a},${b}], y∈[${c},${d}]`);
          showSteps(buildStepsDouble(expr, 'cartesian2d', a, b, c, d, steps, val, 'Both limits constant'));
          vizContext = { mode: "double", coordSystem, expr, a, b, c, d, doubleCase };
        }
      }
    } else {
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
        displayResult(val, `Cylindrical · Jacobian r · ${steps}³ cells`);
        showSteps(buildStepsTriple(expr, 'cylindrical', a, b, c, d, e, f, steps, val));
        vizContext = { mode: "triple", coordSystem, expr, a, b, c, d, e, f };
      } else if (coordSystem === "spherical") {
        const fn = safeCompile(expr, ["rho", "phi", "theta", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
        const wrapped = (rho, phi, theta) =>
          fn(rho, phi, theta, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E) *
          rho *
          rho *
          Math.sin(phi);
        const val = midpointTripleIntegral(wrapped, a, b, c, d, e, f, steps);
        displayResult(val, `Spherical · Jacobian ρ²sin(φ) · ${steps}³ cells`);
        showSteps(buildStepsTriple(expr, 'spherical', a, b, c, d, e, f, steps, val));
        vizContext = { mode: "triple", coordSystem, expr, a, b, c, d, e, f };
      } else {
        const fn = safeCompile(expr, ["x", "y", "z", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
        const wrapped = (x, y, z) =>
          fn(x, y, z, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E);
        const val = midpointTripleIntegral(wrapped, a, b, c, d, e, f, steps);
        displayResult(val, `Cartesian · ${steps}³ midpoint cells`);
        showSteps(buildStepsTriple(expr, 'cartesian3d', a, b, c, d, e, f, steps, val));
        vizContext = { mode: "triple", coordSystem, expr, a, b, c, d, e, f };
      }
    }
    if (vizContext) {
      if (vizContext.mode === "double") {
        renderDoubleVisualization(vizContext);
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
  } else if (coordSystem === "cylindrical") {
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

document.getElementById('stepsToggle').addEventListener('click', () => {
  const head    = document.getElementById('stepsToggle');
  const content = document.getElementById('stepsContent');
  const collapsed = head.classList.toggle('collapsed');
  content.classList.toggle('hidden', collapsed);
});

