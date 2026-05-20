/* ── GCD helper ────────────────────────────────── */
export function gcd(a, b) {
  a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b));
  while (b) { let t = b; b = a % b; a = t; }
  return a || 1;
}

/* ── Recognize symbolic constants ─────────────── */
export function recognizeConstant(val, isExact = false) {
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
