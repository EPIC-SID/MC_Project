# MC_Project — Multiple Integrals Virtual Lab

Interactive virtual lab for multivariate calculus: theory, pre/post tests, symbolic/numeric double and triple integrals, and Desmos/Plotly visualization.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # smoke tests (parser + numerical integrals)
npm run build    # production bundle in dist/
```

Open `index.html` directly only works for a static preview without the Vite module graph; use `npm run dev` for development.

## Project layout

| Path | Purpose |
|------|---------|
| `index.html` | App shell and tab panels |
| `js/main.js` | Entry point — UI wiring and solve handler |
| `js/core/` | Parser, math helpers, nerdamer setup |
| `js/simulation/` | Numerical quadrature, visualization |
| `js/steps/` | Step-by-step builders (`steps-duis`, `steps-double`, `steps-triple`) |
| `js/ui/` | Display, forms, quizzes |
| `data/pretest.json`, `data/posttest.json` | Quiz question banks |
| `tests/` | Vitest smoke tests |

## Editing quizzes

Edit `data/pretest.json` or `data/posttest.json`. Each question needs `id`, `text`, and `options` with `label` and `correct` (boolean). Regenerate from legacy HTML with:

```bash
npm run extract-quizzes
```

## Dependencies

- **nerdamer** (npm) — symbolic integration in step builders
- **Plotly**, **MathJax**, **Desmos** — loaded from CDN in `index.html`
