console.log("Virtual Lab: Module main.js loading...");

import { recognizeConstant } from './core/math-utils.js';
import { safeCompile, compileLimitFn, jsToDesmos } from './core/parser.js';
import { midpointDoubleIntegral, midpointDoubleVariableInner, midpointTripleVariableInner } from './simulation/numerical.js';
import { 
  initDesmos, clearDesmos, 
  renderActiveVisualization, switchVizEngine,
  setLastVizContext
} from './simulation/visualization.js';
import { buildStepsDouble } from './steps/steps-double.js';
import { buildStepsTriple } from './steps/steps-triple.js';
import { displayResult, showSteps } from './ui/display.js';
import { updateMathPreview, updateModeUI, switchTab } from './ui/forms.js';
import { scoreForm } from './ui/quizzes.js';
import { examples } from './data/examples.js';

// ── 1. Event Binding ────────────────────────────────

function bindEvents() {
  // Tab Switching
  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.tab;
      if (target) switchTab(target);
    });
  });

  const modeEl = document.getElementById("mode");
  if (modeEl) modeEl.addEventListener("change", () => { updateModeUI(); updateMathPreview(); });
  const coordEl = document.getElementById("coordSystem");
  if (coordEl) coordEl.addEventListener("change", () => { updateModeUI(); updateMathPreview(); });
  const caseEl = document.getElementById("doubleCase");
  if (caseEl) caseEl.addEventListener("change", () => { updateModeUI(); updateMathPreview(); });

  const modeSelectorEl = document.getElementById("modeSelector");
  if (modeSelectorEl) {
    modeSelectorEl.querySelectorAll(".segment-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (modeEl && modeEl.value !== btn.dataset.value) {
          modeEl.value = btn.dataset.value;
          modeEl.dispatchEvent(new Event("change"));
        }
      });
    });
  }

  ['funcInput', 'xMin', 'xMax', 'yMin', 'yMax', 'zMin', 'zMax', 'innerLower', 'innerUpper'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateMathPreview);
  });

  const toggleDesmosBtn = document.getElementById("toggleDesmosBtn");
  if (toggleDesmosBtn) toggleDesmosBtn.addEventListener("click", () => switchVizEngine("desmos"));
  const togglePlotlyBtn = document.getElementById("togglePlotlyBtn");
  if (togglePlotlyBtn) togglePlotlyBtn.addEventListener("click", () => switchVizEngine("plotly"));

  const solveBtn = document.getElementById("solveBtn");
  if (solveBtn) solveBtn.addEventListener("click", handleSolve);

  const exampleBtn = document.getElementById("exampleBtn");
  if (exampleBtn) {
    let currentExampleIndex = -1;
    exampleBtn.addEventListener("click", () => {
      let newIndex;
      do { newIndex = Math.floor(Math.random() * examples.length); } while (newIndex === currentExampleIndex && examples.length > 1);
      currentExampleIndex = newIndex;
      const ex = examples[newIndex];
      if (modeEl) { modeEl.value = ex.mode || "double"; modeEl.dispatchEvent(new Event("change")); }
      const setVal = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
      setVal("coordSystem", ex.coordSystem); setVal("doubleCase", ex.doubleCase);
      setVal("funcInput", ex.func || ""); setVal("xMin", ex.xMin); setVal("xMax", ex.xMax);
      setVal("yMin", ex.yMin); setVal("yMax", ex.yMax); setVal("zMin", ex.zMin); setVal("zMax", ex.zMax);
      setVal("innerLower", ex.innerLower); setVal("innerUpper", ex.innerUpper);
      const hint = document.getElementById("exampleHint");
      if (hint) { hint.textContent = ex.label || ""; hint.style.display = ex.label ? "block" : "none"; }
      resetResultPanel("Click Compute Integral to evaluate.");
      updateMathPreview();
    });
  }

  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (modeEl) { modeEl.value = "double"; modeEl.dispatchEvent(new Event("change")); }
      const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
      setVal("coordSystem", "cartesian2d"); setVal("doubleCase", "case1"); setVal("funcInput", "x*y");
      setVal("xMin", "0"); setVal("xMax", "1"); setVal("yMin", "0"); setVal("yMax", "1");
      setVal("zMin", "0"); setVal("zMax", "1"); setVal("innerLower", "0"); setVal("innerUpper", "x");
      resetResultPanel("Configure the integral and click Compute.");
      updateMathPreview();
    });
  }

  const stepsToggle = document.getElementById('stepsToggle');
  if (stepsToggle) {
    stepsToggle.addEventListener('click', () => {
      const content = document.getElementById('stepsContent');
      const collapsed = stepsToggle.classList.toggle('collapsed');
      if (content) content.classList.toggle('hidden', collapsed);
    });
  }

  const preForm = document.getElementById("pretestForm");
  if (preForm) preForm.addEventListener("submit", (e) => { e.preventDefault(); scoreForm("pretestForm", "pretestResult"); });
  const postForm = document.getElementById("posttestForm");
  if (postForm) postForm.addEventListener("submit", (e) => { e.preventDefault(); scoreForm("posttestForm", "posttestResult"); });
  const feedForm = document.getElementById("feedbackForm");
  if (feedForm) feedForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const res = document.getElementById("feedbackResult");
    if (res) res.innerHTML = `<div style="margin-top: 1rem; padding: 1rem; border-radius: 8px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981;">✅ <strong>Success!</strong> Thank you for your feedback.</div>`;
    e.target.reset();
  });
}

// ── 2. Initialization ──────────────────────────────

try {
  bindEvents();
  initDesmos();
  updateModeUI();
  updateMathPreview();
  switchTab("aimTab");
  console.log("Virtual Lab: Ready.");
} catch (err) {
  console.error("Virtual Lab: Initialization error:", err);
}

// ── 3. Computation Logic ─────────────────────────

function resetResultPanel(msg) {
  const res = document.getElementById("integralResult");
  const meta = document.getElementById("integralMeta");
  const sym = document.getElementById("integralSymbolic");
  const card = document.getElementById("stepsCard");
  const row = document.getElementById("simBottomRow");
  if (res) res.textContent = "Ready";
  if (meta) meta.textContent = msg;
  if (sym) sym.style.display = "none";
  if (card) card.style.display = "none";
  if (row) row.style.display = "none";
  const topRow = document.querySelector(".sim-top-row");
  if (topRow) topRow.classList.remove("has-results");
  clearDesmos();
}

function handleSolve() {
  const m = document.getElementById("mode");
  if (!m) return;
  const stepsCount = m.value === "double" ? 100 : 40;
  const fIn = document.getElementById("funcInput");
  const expr = fIn ? fIn.value.trim() : "";
  const csEl = document.getElementById("coordSystem");
  const coordSystem = csEl ? csEl.value : "";
  const mode = m.value;

  try {
    let vizContext = null;
    if (mode === "double") {
      const a = parseNumber("xMin");
      const b = parseNumber("xMax");
      if (coordSystem === "polar") {
        const c = parseNumber("yMin");
        const d = parseNumber("yMax");
        if (!(b > a && d > c)) throw new Error("Ensure r max > r min and theta max > theta min.");
        const fn = safeCompile(expr, ["r", "theta", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
        const wrapped = (r, theta) => fn(r, theta, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E) * r;
        const val = midpointDoubleIntegral(wrapped, a, b, c, d, stepsCount);
        const stepsRes = buildStepsDouble(expr, 'polar', a, b, c, d, stepsCount, val, 'polar', '', '', safeCompile, jsToDesmos, recognizeConstant);
        displayResult(stepsRes.exactVal !== null ? stepsRes.exactVal : val, `Polar · Jacobian r`, stepsRes.exactVal !== null, stepsRes.customSym);
        showSteps(stepsRes.html);
        vizContext = { mode: "double", coordSystem, expr, a, b, c, d };
      } else {
        const fn = safeCompile(expr, ["x", "y", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "pow", "PI", "E"]);
        const wrapped = (x, y) => fn(x, y, Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E);
        const dcEl = document.getElementById("doubleCase");
        const doubleCase = dcEl ? dcEl.value : "";
        if (doubleCase === "case1") {
          const loEl = document.getElementById("innerLower"); const hiEl = document.getElementById("innerUpper");
          const lowExpr = loEl ? loEl.value.trim() : "0"; const upExpr = hiEl ? hiEl.value.trim() : "x";
          const lowFn = compileLimitFn(lowExpr, ["x"]); const upFn = compileLimitFn(upExpr, ["x"]);
          const val = midpointDoubleVariableInner(wrapped, a, b, lowFn, upFn, stepsCount, "case1");
          const stepsRes = buildStepsDouble(expr, 'cartesian2d', a, b, 0, 1, stepsCount, val, 'case1', lowExpr, upExpr, safeCompile, jsToDesmos, recognizeConstant);
          displayResult(stepsRes.exactVal !== null ? stepsRes.exactVal : val, `Case 1: outer x∈[${a},${b}]`, stepsRes.exactVal !== null, stepsRes.customSym);
          showSteps(stepsRes.html);
          vizContext = { mode: "double", coordSystem, expr, a, b, c:0, d:1, doubleCase, lowFn, upFn, lowExpr, upExpr };
        } else if (doubleCase === "case2") {
          const c = parseNumber("yMin"); const d = parseNumber("yMax");
          const loEl = document.getElementById("innerLower"); const hiEl = document.getElementById("innerUpper");
          const lowExpr = loEl ? loEl.value.trim() : "0"; const upExpr = hiEl ? hiEl.value.trim() : "y";
          const lowFn = compileLimitFn(lowExpr, ["y"]); const upFn = compileLimitFn(upExpr, ["y"]);
          const val = midpointDoubleVariableInner(wrapped, c, d, lowFn, upFn, stepsCount, "case2");
          const stepsRes = buildStepsDouble(expr, 'cartesian2d', 0, 1, c, d, stepsCount, val, 'case2', lowExpr, upExpr, safeCompile, jsToDesmos, recognizeConstant);
          displayResult(stepsRes.exactVal !== null ? stepsRes.exactVal : val, `Case 2: outer y∈[${c},${d}]`, stepsRes.exactVal !== null, stepsRes.customSym);
          showSteps(stepsRes.html);
          vizContext = { mode: "double", coordSystem, expr, c, d, a:0, b:1, doubleCase, lowFn, upFn, lowExpr, upExpr };
        } else {
          const c = parseNumber("yMin"); const d = parseNumber("yMax");
          const val = midpointDoubleIntegral(wrapped, a, b, c, d, stepsCount);
          const stepsRes = buildStepsDouble(expr, 'cartesian2d', a, b, c, d, stepsCount, val, doubleCase === 'case4' ? 'case4' : 'case3', '', '', safeCompile, jsToDesmos, recognizeConstant);
          displayResult(stepsRes.exactVal !== null ? stepsRes.exactVal : val, `Rectangular Region`, stepsRes.exactVal !== null, stepsRes.customSym);
          showSteps(stepsRes.html);
          vizContext = { mode: "double", coordSystem, expr, a, b, c, d, doubleCase };
        }
      }
    } else {
      const a = parseNumber("xMin"); const b = parseNumber("xMax");
      const cRaw = document.getElementById('yMin')?.value.trim() || "0"; const dRaw = document.getElementById('yMax')?.value.trim() || "1";
      const eRaw = document.getElementById('zMin')?.value.trim() || "0"; const fRaw = document.getElementById('zMax')?.value.trim() || "1";
      if (coordSystem === 'spherical') {
        const fn = safeCompile(expr, ['r','theta','phi','sin','cos','tan','sqrt','abs','exp','log','ln','pow','PI','E']);
        const wrapped = (r,th,ph) => fn(r,th,ph, Math.sin,Math.cos,Math.tan,Math.sqrt,Math.abs,Math.exp,Math.log,Math.log,Math.pow,Math.PI,Math.E)*r*r*Math.sin(ph);
        const cFn = compileLimitFn(cRaw, ['r']), dFn = compileLimitFn(dRaw, ['r']);
        const eFn = compileLimitFn(eRaw, ['r','theta']), fFn = compileLimitFn(fRaw, ['r','theta']);
        const val = midpointTripleVariableInner(wrapped, a, b, cFn, dFn, eFn, fFn, stepsCount);
        const stepsRes = buildStepsTriple(expr, 'spherical', a, b, cRaw, dRaw, eRaw, fRaw, stepsCount, val, recognizeConstant, safeCompile, midpointTripleVariableInner, () => null);
        displayResult(stepsRes.exactVal !== null ? stepsRes.exactVal : val, `Spherical Integral`, stepsRes.exactVal !== null, stepsRes.customSym);
        showSteps(stepsRes.html);
        vizContext = { mode: 'triple', coordSystem, expr, a, b, c: 0, d: 2*Math.PI, e: 0, f: Math.PI };
      } else {
        const fn = safeCompile(expr, ['x','y','z','sin','cos','tan','sqrt','abs','exp','log','ln','pow','PI','E']);
        const wrapped = (x,y,z) => fn(x,y,z, Math.sin,Math.cos,Math.tan,Math.sqrt,Math.abs,Math.exp,Math.log,Math.log,Math.pow,Math.PI,Math.E);
        const cFn = compileLimitFn(cRaw,['x']), dFn = compileLimitFn(dRaw,['x']);
        const eFn = compileLimitFn(eRaw,['x','y']), fFn = compileLimitFn(fRaw,['x','y']);
        const val = midpointTripleVariableInner(wrapped, a, b, cFn, dFn, eFn, fFn, stepsCount);
        const stepsRes = buildStepsTriple(expr, 'cartesian3d', a, b, cRaw, dRaw, eRaw, fRaw, stepsCount, val, recognizeConstant, safeCompile, midpointTripleVariableInner, () => null);
        displayResult(stepsRes.exactVal !== null ? stepsRes.exactVal : val, `Cartesian Triple`, stepsRes.exactVal !== null, stepsRes.customSym);
        showSteps(stepsRes.html);
        vizContext = { mode: 'triple', coordSystem, expr, a, b, c:0, d:1, e:0, f:1 };
      }
    }
    if (vizContext) { setLastVizContext(vizContext); renderActiveVisualization(); }
    const row = document.getElementById('simBottomRow'); if (row) row.style.display = 'flex';
    document.querySelector(".sim-top-row")?.classList.add("has-results");
  } catch (err) {
    const res = document.getElementById('integralResult');
    if (res) res.textContent = '⚠️ Error';
    const meta = document.getElementById('integralMeta');
    if (meta) meta.textContent = err.message;
  }
}

function parseNumber(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const v = parseFloat(el.value);
  if (isNaN(v)) throw new Error(`Invalid input in ${id}`);
  return v;
}
