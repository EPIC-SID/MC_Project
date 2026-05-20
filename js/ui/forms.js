import { jsToDesmos } from '../core/parser.js';

/* ── Live Math Preview ─────────────────────────── */
export function updateMathPreview() {
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

export function updateModeUI() {
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
  const simPageSub = document.querySelector(".sim-page-sub");

  if (!mode || !coordSystem || !doubleCase) return;

  const modeSelector = document.getElementById("modeSelector");
  if (modeSelector) {
    modeSelector.querySelectorAll(".segment-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.value === mode.value);
    });
  }

  if (topRow) {
    topRow.classList.toggle("mode-double", mode.value === "double");
    topRow.classList.toggle("mode-triple", mode.value === "triple");
  }

  xMinWrap.classList.add("hidden");
  yMinWrap.classList.add("hidden");
  zMinWrap.classList.add("hidden");
  innerLowerWrap.classList.add("hidden");
  innerUpperWrap.classList.add("hidden");

  if (mode.value === "double") {
    if (panel3D) panel3D.style.display = "block";
    if (bottomRow && topRow && bottomRow.parentElement !== topRow) {
      topRow.appendChild(bottomRow);
    }
    if (simPageSub) {
      simPageSub.textContent = "Configure your double integral parameters and visualize the bounding region in 3D space.";
    }

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

export function switchTab(tabId) {
  const allButtons = document.querySelectorAll(".tab-btn");
  const allPanels = document.querySelectorAll(".tab-panel");

  allButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });

  allPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });
}
