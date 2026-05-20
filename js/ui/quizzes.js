export function scoreForm(formId, resultId) {
  const form = document.getElementById(formId);
  const el = document.getElementById(resultId);
  if (!form || !el) return;

  const questionNames = [...new Set(
    [...form.querySelectorAll('input[type="radio"]')].map((r) => r.name)
  )];
  const totalQuestions = questionNames.length;

  const unanswered = questionNames.filter(
    (name) => !form.querySelector(`input[name="${name}"]:checked`)
  );
  if (unanswered.length > 0) {
    el.classList.remove('hidden');
    el.style.cssText = 'background:var(--warn-bg);border-color:#f0c060;color:var(--warn);';
    el.innerHTML =
      `⚠️ Please answer <strong>all ${totalQuestions} questions</strong> before submitting. `
      + `(${unanswered.length} unanswered)`;
    return;
  }

  let correct = 0;
  questionNames.forEach((name) => {
    const checked = form.querySelector(`input[name="${name}"]:checked`);
    if (checked && Number(checked.value) === 1) correct++;
  });

  questionNames.forEach((name) => {
    const checked = form.querySelector(`input[name="${name}"]:checked`);
    const card = checked?.closest('.question-card');
    if (!card) return;
    const isRight = Number(checked.value) === 1;
    card.style.borderColor = isRight ? '#1a9e6a' : '#ef4444';
    card.style.background = isRight ? '#e8f8f0' : '#fee2e2';
  });

  const pct = Math.round((correct / totalQuestions) * 100);
  const emoji = pct === 100 ? '🏆' : pct >= 66 ? '✅' : pct >= 33 ? '⚠️' : '❌';
  const grade =
    pct === 100 ? 'Perfect score!'
    : pct >= 66 ? 'Good job!'
    : pct >= 33 ? 'Keep practicing.'
    : 'Review the material and try again.';

  el.classList.remove('hidden');
  el.style.cssText = '';
  el.innerHTML =
    `${emoji} Score: <strong>${correct} / ${totalQuestions}</strong> &nbsp;·&nbsp; `
    + `${pct}% correct &nbsp;·&nbsp; <em>${grade}</em>`
    + `<br><button type="button" class="btn btn-ghost btn-sm" `
    + `style="margin-top:10px;" id="retry-${formId}">🔄 Retry Quiz</button>`;

  document.getElementById(`retry-${formId}`)?.addEventListener('click', () => {
    retryQuiz(formId, resultId);
  });
}

export function retryQuiz(formId, resultId) {
  const form = document.getElementById(formId);
  const el = document.getElementById(resultId);
  if (!form || !el) return;

  form.querySelectorAll('input[type="radio"]').forEach((r) => { r.checked = false; });
  form.querySelectorAll('.question-card').forEach((card) => {
    card.style.borderColor = '';
    card.style.background = '';
  });

  el.classList.add('hidden');
  el.style.display = 'none';
  el.innerHTML = '';
}
