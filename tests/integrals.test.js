import { describe, it, expect } from 'vitest';
import '../js/core/nerdamer-setup.js';
import { safeCompile, normalizeExpression } from '../js/core/parser.js';
import { midpointDoubleIntegral } from '../js/simulation/numerical.js';

const MATH = [
  Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs,
  Math.exp, Math.log, Math.log, Math.pow, Math.PI, Math.E,
];

const VARS = ['x', 'y', 'sin', 'cos', 'tan', 'sqrt', 'abs', 'exp', 'log', 'ln', 'pow', 'PI', 'E'];

function compileXY(expr) {
  const fn = safeCompile(expr, VARS);
  return (x, y) => fn(x, y, ...MATH);
}

describe('parser', () => {
  it('normalizes caret powers to **', () => {
    expect(normalizeExpression('x^2 + y^2')).toBe('x**2 + y**2');
  });

  it('rejects unsupported characters', () => {
    expect(() => safeCompile('x@y', VARS)).toThrow(/unsupported characters/i);
  });
});

describe('midpointDoubleIntegral', () => {
  it('∬ xy dA over [0,1]×[0,1] ≈ 1/4', () => {
    const fn = compileXY('x*y');
    const val = midpointDoubleIntegral(fn, 0, 1, 0, 1, 80);
    expect(val).toBeCloseTo(0.25, 3);
  });

  it('∬ 1 dA over [0,2]×[0,3] ≈ 6 (area)', () => {
    const fn = compileXY('1');
    const val = midpointDoubleIntegral(fn, 0, 2, 0, 3, 50);
    expect(val).toBeCloseTo(6, 2);
  });

  it('∬ (x + y) dA over unit square ≈ 1', () => {
    const fn = compileXY('x + y');
    const val = midpointDoubleIntegral(fn, 0, 1, 0, 1, 100);
    expect(val).toBeCloseTo(1, 2);
  });
});
