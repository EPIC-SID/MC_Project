import { safeCompile, jsToDesmos } from '../core/parser.js';

/* ── Desmos 3D Visualization ─────────────────────── */
export let desmosCalc = null;
export let desmosIs3D = false;
export let currentVizEngine = 'desmos';
export let lastVizContext = null;

export function initDesmos() {
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

export function setVizStatus(msg) {
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

export function clearDesmos() {
  setLastVizContext(null);
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

export function setLastVizContext(ctx) {
  lastVizContext = ctx;
}

export function setCurrentVizEngine(engine) {
  currentVizEngine = engine;
}

export function setDesmos3DBounds(xmin, xmax, ymin, ymax, zmin, zmax) {
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

export function renderDesmosRegion(modeInfo) {
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

    desmosCalc.setExpression({
      id: 'surf', latex: `z=${fTex}${domX}${domY}`, color: BLU,
    });
    desmosCalc.setExpression({
      id: 'vol', latex: `0\\le z\\le ${fTex}${domX}${domY}`, color: BLU,
    });
    desmosCalc.setExpression({
      id: 'floor', latex: `z=0${domX}${domY}`, color: GRY,
    });

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

export function sampleRange(min, max, count) {
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

export function renderSurfacePlot(title, xVals, yVals, zGrid) {
  if (!window.Plotly) { setVizStatus("3D library failed to load."); return; }
  setVizStatus(null);

  const nx = xVals.length;
  const ny = yVals.length;

  const surfaceTrace = {
    type: "surface",
    x: xVals, y: yVals, z: zGrid,
    colorscale: "Blues",
    opacity: 0.82,
    showscale: false,
    name: "f(x,y)",
    hovertemplate: "x: %{x:.3f}<br>y: %{y:.3f}<br>f: %{z:.4f}<extra></extra>",
  };

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

  function makeCurtain(xArr, yArr, zTop) {
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

  const frontCurtain = makeCurtain(xVals, xVals.map(() => yVals[0]),      zGrid[0]);
  const backCurtain  = makeCurtain(xVals, xVals.map(() => yVals[ny - 1]), zGrid[ny - 1]);
  const leftCurtain  = makeCurtain(yVals.map(() => xVals[0]),      yVals, zGrid.map(row => row[0]));
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


export function renderScatter3D(title, points) {
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

export function renderDoubleVisualization(modeInfo) {
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

export function estimateInnerRange(outerMin, outerMax, innerMinFn, innerMaxFn) {
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

export function renderTripleVisualization(modeInfo) {
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

export function renderActiveVisualization() {
  if (!lastVizContext) return;
  
  const desmosDiv = document.getElementById("desmosDiv");
  const viz3d = document.getElementById("viz3d");
  const st = document.getElementById('desmosStatus');
  const toggleGroup = document.getElementById("vizToggleGroup");
  
  if (st) st.style.display = 'none';

  if (lastVizContext.mode === 'triple') {
    if (desmosDiv) desmosDiv.style.display = 'none';
    if (viz3d) viz3d.style.display = 'block';
    renderTripleVisualization(lastVizContext);
    if (toggleGroup) toggleGroup.style.display = 'none';
  } else {
    if (toggleGroup) toggleGroup.style.display = 'flex';
    
    if (currentVizEngine === 'desmos') {
      if (viz3d) viz3d.style.display = 'none';
      if (desmosDiv) desmosDiv.style.display = 'block';
      renderDesmosRegion(lastVizContext);
    } else {
      if (desmosDiv) desmosDiv.style.display = 'none';
      if (viz3d) viz3d.style.display = 'block';
      renderDoubleVisualization(lastVizContext);
      
      setTimeout(() => {
        if (window.Plotly) {
          window.Plotly.Plots.resize('viz3d');
        }
      }, 50);
    }
  }
}

export function switchVizEngine(engine) {
  setCurrentVizEngine(engine);
  const desmosBtn = document.getElementById("toggleDesmosBtn");
  const plotlyBtn = document.getElementById("togglePlotlyBtn");
  if (desmosBtn && plotlyBtn) {
    desmosBtn.classList.toggle("active", engine === "desmos");
    plotlyBtn.classList.toggle("active", engine === "plotly");
  }
  if (lastVizContext) {
    renderActiveVisualization();
  }
}
