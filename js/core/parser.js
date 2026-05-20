import { nerdamer } from './nerdamer-setup.js';

export function toNerd(e) {
  // Convert JS expression syntax → nerdamer syntax
  return String(e).replace(/\*\*/g, '^').replace(/\bln\b/g, 'log');
}

export function nSub(expr, variable, value) {
  if (!nerdamer) return null;
  try {
    const sub = {}; sub[variable] = toNerd(String(value));
    return nerdamer(toNerd(expr), sub).toString();
  } catch { return null; }
}

export function normalizeExpression(input) {
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
  const fnNames = ["sin", "cos", "tan", "sqrt", "log", "ln", "abs", "exp"];
  for (const fn of fnNames) {
    const re = new RegExp(`\\b${fn}\\s*([a-zA-Z][a-zA-Z0-9_]*)\\b(?!\\s*\\()`, "g");
    expr = expr.replace(re, `${fn}($1)`);
  }

  // Conservative implicit multiplication:
  expr = expr.replace(/(\d)\s*([a-zA-Z(])/g, "$1*$2");
  expr = expr.replace(/(\))\s*([a-zA-Z(])/g, "$1*$2");

  return expr;
}

export function safeCompile(expression, vars) {
  const normalized = normalizeExpression(expression);
  const allowed = /^[a-z0-9_+\-*/().,^%\s,]*$/i;
  if (!allowed.test(normalized)) {
    throw new Error("Expression contains unsupported characters.");
  }

  return new Function(...vars, `return ${normalized};`);
}

// JS math syntax → Desmos LaTeX
export function jsToDesmos(expr) {
  return String(expr)
    .replace(/\*\*/g, '^')
    .replace(/\bsqrt\s*\(([^)]+)\)/g, '\\sqrt{$1}')
    .replace(/\babs\s*\(([^)]+)\)/g,  '\\left|$1\\right|')
    .replace(/\bsin\b/g,  '\\sin').replace(/\bcos\b/g, '\\cos')
    .replace(/\btan\b/g,  '\\tan').replace(/\bln\b/g,  '\\ln')
    .replace(/\bexp\s*\(([^)]+)\)/g, 'e^{$1}')
    .replace(/\bPI\b/g,   '\\pi').replace(/\bpi\b/gi, '\\pi')
    .replace(/\btheta\b/g,'\\theta')
    .replace(/([0-9])\s*\*\s*([a-zA-Z(\\])/g, '$1$2')  // 2*x → 2x
    .replace(/([a-zA-Z])\s*\*\s*([a-zA-Z(\\])/g, '$1$2') // x*y → xy
    .replace(/\s*\*\s*/g, '\\cdot ');                    // remaining * → ·
}

export function compileLimitFn(rawExpr, outerVars) {
  const raw = String(rawExpr).trim();
  const MNAMES = ['sin','cos','tan','sqrt','abs','exp','log','ln','pow','PI','E'];
  const MVALS  = [Math.sin,Math.cos,Math.tan,Math.sqrt,Math.abs,
                  Math.exp,Math.log,Math.log,Math.pow,Math.PI,Math.E];
  const num = Number(raw);
  if (!isNaN(num) && raw !== '') return () => num;
  const fn = safeCompile(raw, [...outerVars, ...MNAMES]);
  return (...vals) => fn(...vals, ...MVALS);
}
