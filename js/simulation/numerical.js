export function midpointDoubleIntegral(fn, a, b, c, d, n) {
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

export function midpointDoubleVariableInner(fn, outerMin, outerMax, innerMinFn, innerMaxFn, n, caseType) {
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

export function midpointTripleIntegral(fn, a, b, c, d, e, f, n) {
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

export function midpointTripleVariableInner(fn, a, b, cFn, dFn, eFn, fFn, n) {
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
