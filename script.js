function safeCompile(expression, mode) {
  const allowed = /^[0-9x y z+\-*/().,^% Mathsincotaqrlgexpu]*$/i;
  if (!allowed.test(expression)) {
    throw new Error("Expression contains unsupported characters.");
  }

  const normalized = expression.replace(/\^/g, "**");
  if (mode === "double") {
    return new Function("x", "y", `return ${normalized};`);
  }
  return new Function("x", "y", "z", `return ${normalized};`);
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
  if (count === 0) {
    document.getElementById(outputId).textContent = "Please answer all questions.";
    return;
  }
  document.getElementById(outputId).textContent = `Score: ${total}/${count}`;
}

function updateModeUI() {
  const mode = document.getElementById("mode").value;
  const zMinWrap = document.getElementById("zMinWrap");
  const zMaxWrap = document.getElementById("zMaxWrap");
  const funcInput = document.getElementById("funcInput");

  if (mode === "double") {
    zMinWrap.classList.add("hidden");
    zMaxWrap.classList.add("hidden");
    if (funcInput.value.trim() === "" || funcInput.value.includes("z")) {
      funcInput.value = "x*y";
    }
  } else {
    zMinWrap.classList.remove("hidden");
    zMaxWrap.classList.remove("hidden");
    if (funcInput.value.trim() === "" || !funcInput.value.includes("z")) {
      funcInput.value = "x*y + z";
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

document.getElementById("solveBtn").addEventListener("click", () => {
  const resultEl = document.getElementById("integralResult");
  const metaEl = document.getElementById("integralMeta");
  try {
    const mode = document.getElementById("mode").value;
    const expr = document.getElementById("funcInput").value.trim();
    const steps = Math.max(2, Math.min(200, parseInt(document.getElementById("steps").value, 10)));

    const a = parseNumber("xMin");
    const b = parseNumber("xMax");
    const c = parseNumber("yMin");
    const d = parseNumber("yMax");

    if (!(b > a && d > c)) {
      throw new Error("Ensure x max > x min and y max > y min.");
    }

    if (mode === "double") {
      const fn = safeCompile(expr, mode);
      const val = midpointDoubleIntegral(fn, a, b, c, d, steps);
      resultEl.textContent = `Approximate Value: ${val.toFixed(8)}`;
      metaEl.textContent = `Computed using ${steps}x${steps} midpoint cells.`;
    } else {
      const e = parseNumber("zMin");
      const f = parseNumber("zMax");
      if (!(f > e)) {
        throw new Error("Ensure z max > z min.");
      }
      const fn = safeCompile(expr, mode);
      const val = midpointTripleIntegral(fn, a, b, c, d, e, f, steps);
      resultEl.textContent = `Approximate Value: ${val.toFixed(8)}`;
      metaEl.textContent = `Computed using ${steps}^3 midpoint cells.`;
    }
  } catch (error) {
    resultEl.textContent = "Computation failed.";
    metaEl.textContent = error.message;
  }
});

document.getElementById("exampleBtn").addEventListener("click", () => {
  const mode = document.getElementById("mode").value;
  if (mode === "double") {
    document.getElementById("funcInput").value = "x + y";
    document.getElementById("xMin").value = "0";
    document.getElementById("xMax").value = "1";
    document.getElementById("yMin").value = "0";
    document.getElementById("yMax").value = "1";
    document.getElementById("steps").value = "40";
  } else {
    document.getElementById("funcInput").value = "x*y + z";
    document.getElementById("xMin").value = "0";
    document.getElementById("xMax").value = "1";
    document.getElementById("yMin").value = "0";
    document.getElementById("yMax").value = "1";
    document.getElementById("zMin").value = "0";
    document.getElementById("zMax").value = "1";
    document.getElementById("steps").value = "28";
  }
});

document.getElementById("resetBtn").addEventListener("click", () => {
  document.getElementById("mode").value = "double";
  updateModeUI();
  document.getElementById("funcInput").value = "x*y";
  document.getElementById("xMin").value = "0";
  document.getElementById("xMax").value = "1";
  document.getElementById("yMin").value = "0";
  document.getElementById("yMax").value = "1";
  document.getElementById("zMin").value = "0";
  document.getElementById("zMax").value = "1";
  document.getElementById("steps").value = "40";
  document.getElementById("integralResult").textContent = "Ready";
  document.getElementById("integralMeta").textContent = "Use valid JavaScript expression, e.g. x*y + z*z.";
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
    "Thank you for your feedback. Your response has been recorded locally.";
  event.target.reset();
});

updateModeUI();
switchTab("aimTab");
