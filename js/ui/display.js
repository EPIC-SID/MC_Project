import { recognizeConstant } from '../core/math-utils.js';

export function displayResult(val, metaText, isExact = false, customSym = null) {
  const resultEl = document.getElementById('integralResult');
  const metaEl   = document.getElementById('integralMeta');
  const symWrap  = document.getElementById('integralSymbolic');
  const symVal   = document.getElementById('integralSymVal');

  const recognized = recognizeConstant(val, isExact);
  
  if (!isExact && recognized) {
    val = recognized.val;
    isExact = true;
  }

  if (isExact) {
    resultEl.innerHTML = `<span style="color: #2563eb">= ${Number(val.toFixed(10))}</span>`;
  } else {
    resultEl.textContent = `≈ ${val.toFixed(8)}`;
  }
  metaEl.textContent   = metaText;

  if (recognized || customSym) {
    const symString = customSym || recognized.sym;
    if (symString.includes('\\') || symString.includes('^') || symString.includes('_')) {
      symVal.innerHTML = `\\( \\displaystyle ${symString} \\)`;
      if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        MathJax.typesetPromise([symVal]).catch(() => {});
      }
    } else {
      symVal.textContent = symString;
    }
    
    const labelEl = symWrap.querySelector('.sym-label');
    if (labelEl) {
      labelEl.textContent = isExact ? '=' : '≈';
    }
    symWrap.style.display = 'block';
  } else {
    symWrap.style.display = 'none';
  }
}

export function showSteps(html) {
  const card    = document.getElementById('stepsCard');
  const content = document.getElementById('stepsContent');
  if (!card || !content) return;
  card.style.display = 'block';
  content.innerHTML  = html;
  content.classList.remove('hidden');
  document.getElementById('stepsToggle').classList.remove('collapsed');
  
  if (window.MathJax) {
    MathJax.typesetPromise([content]).catch((err) => console.log('MathJax error: ', err));
  }
}
