export const pretestData = {
  "title": "Pretest",
  "description": "Assess your prerequisite knowledge before the experiment.",
  "questions": [
    {
      "id": "pre1",
      "text": "What does a double integral ∫∫_R f(x,y) dA represent geometrically?",
      "options": [
        { "label": "Slope of the surface z = f(x,y)", "correct": false },
        { "label": "Volume under the surface z = f(x,y) above region R", "correct": true },
        { "label": "Length of the curve f(x,y) = 0", "correct": false },
        { "label": "Gradient of f(x,y) over R", "correct": false }
      ]
    },
    {
      "id": "pre2",
      "text": "The notation ∫∫_R f(x,y) dA indicates integration over how many variables?",
      "options": [
        { "label": "One variable", "correct": false },
        { "label": "Two variables", "correct": true },
        { "label": "Three variables", "correct": false },
        { "label": "Four variables", "correct": false }
      ]
    },
    {
      "id": "pre3",
      "text": "In Cartesian coordinates, the area element dA in a double integral is:",
      "options": [
        { "label": "dx + dy", "correct": false },
        { "label": "dx dy", "correct": true },
        { "label": "dx / dy", "correct": false },
        { "label": "x · y", "correct": false }
      ]
    },
    {
      "id": "pre4",
      "text": "A double integral can be considered an extension of which concept?",
      "options": [
        { "label": "Differentiation", "correct": false },
        { "label": "Triple integration", "correct": false },
        { "label": "Single-variable integration", "correct": true },
        { "label": "Matrix multiplication", "correct": false }
      ]
    },
    {
      "id": "pre5",
      "text": "Double integrals are evaluated over which type of domain?",
      "options": [
        { "label": "A single point", "correct": false },
        { "label": "A curve in space", "correct": false },
        { "label": "A planar region R", "correct": true },
        { "label": "A solid 3D region", "correct": false }
      ]
    },
    {
      "id": "pre6",
      "text": "The area of a planar region R can be computed using which double integral?",
      "options": [
        { "label": "∫∫_R f(x,y) dA", "correct": false },
        { "label": "∫∫_R 1 dA", "correct": true },
        { "label": "∫ x dx", "correct": false },
        { "label": "∫∫∫ 1 dV", "correct": false }
      ]
    },
    {
      "id": "pre7",
      "text": "Fubini's theorem states that a double integral over a rectangle can be evaluated as:",
      "options": [
        { "label": "A single integral only", "correct": false },
        { "label": "An iterated integral in either order (dy dx or dx dy)", "correct": true },
        { "label": "A product of two gradients", "correct": false },
        { "label": "A triple integral", "correct": false }
      ]
    },
    {
      "id": "pre8",
      "text": "In polar coordinates, x and y are expressed as:",
      "options": [
        { "label": "x = r sinθ, y = r cosθ", "correct": false },
        { "label": "x = r cosθ, y = r sinθ", "correct": true },
        { "label": "x = θ cosr, y = θ sinr", "correct": false },
        { "label": "x = r, y = θ", "correct": false }
      ]
    },
    {
      "id": "pre9",
      "text": "When converting a double integral to polar form, the area element dA becomes:",
      "options": [
        { "label": "dr dθ", "correct": false },
        { "label": "r² dr dθ", "correct": false },
        { "label": "r dr dθ", "correct": true },
        { "label": "dθ / dr", "correct": false }
      ]
    },
    {
      "id": "pre10",
      "text": "The Jacobian factor r in polar coordinates arises from:",
      "options": [
        { "label": "Gradient of polar fields", "correct": false },
        { "label": "Taylor series expansion", "correct": false },
        { "label": "The Jacobian determinant of the coordinate transformation", "correct": true },
        { "label": "L'Hôpital's rule", "correct": false }
      ]
    },
    {
      "id": "pre11",
      "text": "Polar coordinates are most suitable for evaluating double integrals over which regions?",
      "options": [
        { "label": "Triangular regions", "correct": false },
        { "label": "Rectangular regions", "correct": false },
        { "label": "Circular or annular regions", "correct": true },
        { "label": "Parabolic regions", "correct": false }
      ]
    },
    {
      "id": "pre12",
      "text": "In an iterated integral ∫∫ f(x,y) dy dx, which integration is performed first?",
      "options": [
        { "label": "Integration with respect to x", "correct": false },
        { "label": "Integration with respect to y (the inner integral)", "correct": true },
        { "label": "Both simultaneously", "correct": false },
        { "label": "The outer integral first", "correct": false }
      ]
    },
    {
      "id": "pre13",
      "text": "If f(x,y) = g(x)·h(y) and the region is a rectangle, the double integral equals:",
      "options": [
        { "label": "∫g(x) dx + ∫h(y) dy", "correct": false },
        { "label": "[∫g(x) dx] × [∫h(y) dy]", "correct": true },
        { "label": "∫g(x)·h(y) dx", "correct": false },
        { "label": "g(x) / h(y)", "correct": false }
      ]
    },
    {
      "id": "pre14",
      "text": "Which theorem allows switching the order of integration in a double integral?",
      "options": [
        { "label": "Green's theorem", "correct": false },
        { "label": "Stokes' theorem", "correct": false },
        { "label": "Fubini's theorem", "correct": true },
        { "label": "Rolle's theorem", "correct": false }
      ]
    },
    {
      "id": "pre15",
      "text": "A double integral is primarily used to compute which of the following?",
      "options": [
        { "label": "Length of a space curve", "correct": false },
        { "label": "Directional derivative of a function", "correct": false },
        { "label": "Eigenvalues of a matrix", "correct": false },
        { "label": "Area of a planar region or volume under a surface", "correct": true }
      ]
    }
  ]
};

export const posttestData = {
  "title": "Posttest",
  "description": "Evaluate your understanding after completing the experiment.",
  "questions": [
    {
      "id": "post1",
      "text": "Changing the order of integration in a double integral has what effect?",
      "options": [
        { "label": "It always changes the value", "correct": false },
        { "label": "No effect on the value if the limits are set correctly", "correct": true },
        { "label": "It makes the integral zero", "correct": false },
        { "label": "It makes the integral undefined", "correct": false }
      ]
    },
    {
      "id": "post2",
      "text": "Evaluate ∫∫_R (x + y) dA over the rectangle x∈[0,1], y∈[0,1].",
      "options": [
        { "label": "0.5", "correct": false },
        { "label": "1", "correct": true },
        { "label": "2", "correct": false },
        { "label": "0.25", "correct": false }
      ]
    },
    {
      "id": "post3",
      "text": "In polar coordinates, the correct volume element dA for a double integral is:",
      "options": [
        { "label": "dr dθ", "correct": false },
        { "label": "r dr dθ", "correct": true },
        { "label": "r² dr dθ", "correct": false },
        { "label": "dθ dr / r", "correct": false }
      ]
    },
    {
      "id": "post4",
      "text": "The area of a disk of radius a using a double integral in polar form equals:",
      "options": [
        { "label": "2πa", "correct": false },
        { "label": "(4/3)πa³", "correct": false },
        { "label": "πa²", "correct": true },
        { "label": "2πa²", "correct": false }
      ]
    },
    {
      "id": "post5",
      "text": "Polar coordinates are best suited for double integrals over which region?",
      "options": [
        { "label": "Triangles", "correct": false },
        { "label": "Circles and annuli", "correct": true },
        { "label": "Squares", "correct": false },
        { "label": "Ellipses in Cartesian form", "correct": false }
      ]
    },
    {
      "id": "post6",
      "text": "To find the mass of a lamina with variable density ρ(x,y), which integral is used?",
      "options": [
        { "label": "∫∫_R ρ(x,y) dA", "correct": true },
        { "label": "∫∫_R 1 dA", "correct": false },
        { "label": "∫ ρ(x) dx", "correct": false },
        { "label": "∫∫∫ ρ dV", "correct": false }
      ]
    },
    {
      "id": "post7",
      "text": "The key principle behind switching integration order in a double integral relies on:",
      "options": [
        { "label": "Random approximation", "correct": false },
        { "label": "Fubini's theorem and continuity of f", "correct": true },
        { "label": "Numerical methods", "correct": false },
        { "label": "Differentiation under the integral sign", "correct": false }
      ]
    },
    {
      "id": "post8",
      "text": "Evaluate ∫_0^1 ∫_0^1 xy dy dx.",
      "options": [
        { "label": "1", "correct": false },
        { "label": "1/2", "correct": false },
        { "label": "1/4", "correct": true },
        { "label": "1/8", "correct": false }
      ]
    },
    {
      "id": "post9",
      "text": "For a double integral over a type-I region (y-limits depend on x), the correct iterated form is:",
      "options": [
        { "label": "∫∫ f dy dy", "correct": false },
        { "label": "∫_a^b [∫_g1(x)^g2(x) f dy] dx", "correct": true },
        { "label": "∫_c^d [∫_h1(y)^h2(y) f dx] dy", "correct": false },
        { "label": "∫ f(x,y) dx", "correct": false }
      ]
    },
    {
      "id": "post10",
      "text": "What does ∫∫_R 1 dA compute for region R?",
      "options": [
        { "label": "Volume of R", "correct": false },
        { "label": "Area of the region R", "correct": true },
        { "label": "Perimeter of R", "correct": false },
        { "label": "Density of R", "correct": false }
      ]
    },
    {
      "id": "post11",
      "text": "For a separable integrand f(x,y) = g(x)·h(y) on a rectangle [a,b]×[c,d], the double integral equals:",
      "options": [
        { "label": "g(b)·h(d) − g(a)·h(c)", "correct": false },
        { "label": "[∫_a^b g(x) dx] × [∫_c^d h(y) dy]", "correct": true },
        { "label": "∫_a^b g(x) dx + ∫_c^d h(y) dy", "correct": false },
        { "label": "g(x) / h(y)", "correct": false }
      ]
    },
    {
      "id": "post12",
      "text": "The Jacobian factor r must be included in polar double integrals because:",
      "options": [
        { "label": "It cancels with dθ", "correct": false },
        { "label": "It accounts for the stretching of area elements in polar coordinates", "correct": true },
        { "label": "It is needed only for r > 1", "correct": false },
        { "label": "It is an optional scaling factor", "correct": false }
      ]
    },
    {
      "id": "post13",
      "text": "Which method is most suitable for evaluating ∫∫_{x²+y²≤4} (x²+y²) dA?",
      "options": [
        { "label": "Cartesian integration with constant limits", "correct": false },
        { "label": "Polar coordinate transformation", "correct": true },
        { "label": "Single-variable integration", "correct": false },
        { "label": "Numerical differentiation", "correct": false }
      ]
    },
    {
      "id": "post14",
      "text": "Double integration is particularly useful for finding which quantity for a 2D lamina?",
      "options": [
        { "label": "Velocity at a point", "correct": false },
        { "label": "Mass, area, and centre of mass", "correct": true },
        { "label": "Electric field intensity", "correct": false },
        { "label": "Gradient vector field", "correct": false }
      ]
    },
    {
      "id": "post15",
      "text": "The area of the quarter-disk of radius a in the first quadrant, using polar integration, equals:",
      "options": [
        { "label": "πa", "correct": false },
        { "label": "a²", "correct": false },
        { "label": "πa² / 4", "correct": true },
        { "label": "2πa²", "correct": false }
      ]
    }
  ]
};
