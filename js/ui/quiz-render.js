/**
 * Build quiz question cards from JSON data.
 * @param {string} formId
 * @param {{ title: string, description?: string, questions: Array<{ id: string, text: string, options: Array<{ label: string, correct: boolean }> }> }} quizData
 */
export function renderQuizForm(formId, quizData) {
  const form = document.getElementById(formId);
  if (!form || !quizData?.questions?.length) return;

  const submitLabel = formId === 'pretestForm' ? 'Submit Pretest' : 'Submit Posttest';

  form.innerHTML = quizData.questions
    .map(
      (q, index) => `
    <div class="question-card">
      <div class="question-num">Q${index + 1}</div>
      <p class="question-text">${q.text}</p>
      <div class="options">
        ${q.options
          .map(
            (opt) => `
          <label class="option-card">
            <input type="radio" name="${q.id}" value="${opt.correct ? '1' : '0'}" />
            <span>${opt.label}</span>
          </label>`
          )
          .join('')}
      </div>
    </div>`
    )
    .join('') + `
    <div class="quiz-actions">
      <button type="submit" class="btn btn-primary">${submitLabel}</button>
    </div>`;
}

/** @param {import('../../data/pretest.json')} pretest @param {import('../../data/posttest.json')} posttest */
export function initQuizzes(pretest, posttest) {
  renderQuizForm('pretestForm', pretest);
  renderQuizForm('posttestForm', posttest);
}
