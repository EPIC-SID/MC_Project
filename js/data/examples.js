export const examples = [
  // ── DOUBLE · Cartesian Case 1 (outer x, variable y limits) ──────────────
  {
    mode: "double", coordSystem: "cartesian2d", doubleCase: "case1",
    func: "exp(y/x)", xMin: "0", xMax: "1", yMin: "", yMax: "", innerLower: "0", innerUpper: "x",
    label: "PDF Type-I Q4 · ∫₀¹∫₀ˣ eʸ/ˣ dy dx · Expected: (e−1)/2 ≈ 0.8591"
  },
  {
    mode: "double", coordSystem: "cartesian2d", doubleCase: "case1",
    func: "x*y*(x+y)", xMin: "0", xMax: "1", yMin: "", yMax: "", innerLower: "x^2", innerUpper: "x",
    label: "PDF Type-II Q1 · ∫₀¹∫ₓ²ˣ xy(x+y) dy dx · Expected: 3/56 ≈ 0.0536"
  },
  {
    mode: "double", coordSystem: "cartesian2d", doubleCase: "case1",
    func: "1/(1+x^2+y^2)", xMin: "0", xMax: "1", yMin: "", yMax: "", innerLower: "0", innerUpper: "sqrt(1+x^2)",
    label: "PDF Type-I Q1 · ∫₀¹∫₀^√(1+x²) 1/(1+x²+y²) dy dx · Expected: π/4·ln(1+√2) ≈ 0.6786"
  },
  {
    mode: "double", coordSystem: "cartesian2d", doubleCase: "case1",
    func: "x*y", xMin: "0", xMax: "1", yMin: "", yMax: "", innerLower: "x^2", innerUpper: "x",
    label: "PDF Type-II — ∫₀¹∫ₓ²ˣ xy dy dx · Expected: 1/12 ≈ 0.0833"
  },
  // ── DOUBLE · Cartesian Case 2 (outer y, variable x limits) ──────────────
  {
    mode: "double", coordSystem: "cartesian2d", doubleCase: "case2",
    func: "exp(y^2)", xMin: "", xMax: "", yMin: "0", yMax: "1", innerLower: "0", innerUpper: "2*y",
    label: "PDF Type-II Q4 · ∫₀¹∫₀^{2y} eʸ² dx dy · Expected: e−1 ≈ 1.7183"
  },
  {
    mode: "double", coordSystem: "cartesian2d", doubleCase: "case2",
    func: "x*y*exp(-x^2)", xMin: "", xMax: "", yMin: "0", yMax: "1", innerLower: "0", innerUpper: "y",
    label: "PDF Type-I Q5 · ∫₀¹∫₀ʸ xye^{-x²} dx dy · Expected: 1/(4e) ≈ 0.0920"
  },
  {
    mode: "double", coordSystem: "cartesian2d", doubleCase: "case2",
    func: "exp(x+y)", xMin: "", xMax: "", yMin: "0", yMax: "1", innerLower: "y", innerUpper: "1",
    label: "PDF Type-I variant · ∫₀¹∫ᵧ¹ eˣ⁺ʸ dx dy · Expected: (e−1)²/2 ≈ 1.4761"
  },
  // ── DOUBLE · Cartesian Case 3 (rectangular) ─────────────────────────────
  {
    mode: "double", coordSystem: "cartesian2d", doubleCase: "case3",
    func: "exp(-x^2-y^2)", xMin: "0", xMax: "2", yMin: "0", yMax: "2", innerLower: "", innerUpper: "",
    label: "PDF Type-IV Q1 (large square ≈ quarter-plane) · Expected → π/4 ≈ 0.7854 as a→∞"
  },
  // ── DOUBLE · Cartesian Case 4 (separable) ───────────────────────────────
  {
    mode: "double", coordSystem: "cartesian2d", doubleCase: "case4",
    func: "sin(x)*cos(y)", xMin: "0", xMax: "3.14159", yMin: "0", yMax: "1.5708", innerLower: "", innerUpper: "",
    label: "Classic separable · ∫₀^π sin(x) dx · ∫₀^{π/2} cos(y) dy · Expected: 2×1 = 2"
  },
  {
    mode: "double", coordSystem: "cartesian2d", doubleCase: "case3",
    func: "exp(x+y+0*z)", xMin: "0", xMax: "1", yMin: "0", yMax: "1", innerLower: "", innerUpper: "",
    label: "PDF Type-VI Q2 (double slice) · ∫₀¹∫₀¹ eˣ⁺ʸ dy dx · Expected: (e−1)² ≈ 2.9525"
  },
  // ── DOUBLE · Polar ────────────────────────────────────────────────────────
  {
    mode: "double", coordSystem: "polar", doubleCase: "case3",
    func: "exp(-r^2)", xMin: "0", xMax: "1", yMin: "0", yMax: "1.5708", innerLower: "", innerUpper: "",
    label: "PDF Type-IV Q1 (Polar) · ∫₀^{π/2}∫₀¹ e^{-r²}·r dr dθ · Expected: π/4·(1−1/e) ≈ 0.3974"
  },
  {
    mode: "double", coordSystem: "polar", doubleCase: "case3",
    func: "r^2*cos(theta)", xMin: "0", xMax: "2", yMin: "0", yMax: "1.5708", innerLower: "", innerUpper: "",
    label: "PDF Type-III variant · ∫₀^{π/2}∫₀² r²cos(θ)·r dr dθ · Expected: 4"
  },
  {
    mode: "double", coordSystem: "polar", doubleCase: "case3",
    func: "sin(r^2)", xMin: "0", xMax: "1.7725", yMin: "0", yMax: "6.28318", innerLower: "", innerUpper: "",
    label: "PDF Type-III Q1 (a=√π) · ∫₀^{2π}∫₀^√π sin(r²)·r dr dθ · Expected: π(1−cos(π))=2π≈6.2832"
  },
  // ── TRIPLE · Cartesian ────────────────────────────────────────────────────
  {
    mode: "triple", coordSystem: "cartesian3d",
    func: "exp(x+y+z)", xMin: "0", xMax: "1", yMin: "0", yMax: "1", zMin: "0", zMax: "1",
    label: "PDF Type-VI Q2 · ∭ eˣ⁺ʸ⁺ᶻ over unit cube · Expected: (e−1)³ ≈ 5.0731"
  },
  {
    mode: "triple", coordSystem: "cartesian3d",
    func: "exp(z)", xMin: "0", xMax: "1", yMin: "0", yMax: "1-x", zMin: "0", zMax: "x+y",
    label: "PDF Type-VI Q5 · ∭ eᶻ, y∈[0,1−x], z∈[0,x+y] · Expected: 1/2 = 0.5000"
  },
  {
    mode: "triple", coordSystem: "cartesian3d",
    func: "1", xMin: "0", xMax: "1", yMin: "0", yMax: "1-x", zMin: "0", zMax: "1-x-y",
    label: "PDF Type-IX Q15 · Volume of tetrahedron x+y+z≤1 · Expected: 1/6 ≈ 0.1667"
  },
  {
    mode: "triple", coordSystem: "cartesian3d",
    func: "x+y+z", xMin: "0", xMax: "1", yMin: "0", yMax: "1-x", zMin: "0", zMax: "1-x-y",
    label: "PDF Type-VII Q2 (a=b=c=1) · ∭(x+y+z) over tetrahedron · Expected: abc(a+b+c)/24 = 3/24 = 0.125"
  },
  // ── TRIPLE · Polar / Spherical ────────────────────────────────────────────
  {
    mode: "triple", coordSystem: "spherical",
    func: "r^3*sin(phi)^2*cos(phi)*cos(theta)*sin(theta)",
    xMin: "0", xMax: "2", yMin: "0", yMax: "1.5708", zMin: "0", zMax: "1.5708",
    label: "PDF Type-VIII Q3 · ∭ xyz over +ve octant of sphere r=2 · Expected: 4/3 ≈ 1.3333"
  },
  {
    mode: "triple", coordSystem: "spherical",
    func: "1",
    xMin: "0", xMax: "1", yMin: "0", yMax: "6.28318", zMin: "0", zMax: "3.14159",
    label: "Volume of unit sphere via spherical integration · Expected: 4π/3 ≈ 4.1888"
  }
];
