import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function extractForm(formId) {
  const start = html.indexOf(`<form id="${formId}"`);
  const end = html.indexOf('</form>', start) + 7;
  const form = html.slice(start, end);
  const cards = [...form.matchAll(/<div class="question-card">([\s\S]*?)<\/div>\s*(?=<div class="question-card"|<div class="quiz-actions")/g)];
  return cards.map((card) => {
    const block = card[1];
    const textM = block.match(/<p class="question-text">([\s\S]*?)<\/p>/);
    const text = textM ? textM[1].trim() : '';
    const nameM = block.match(/name="([^"]+)"/);
    const id = nameM ? nameM[1] : 'q';
    const opts = [...block.matchAll(/value="(\d)" \/><span>([\s\S]*?)<\/span>/g)];
    return {
      id,
      text,
      options: opts.map((o) => ({ label: o[2].trim(), correct: o[1] === '1' })),
    };
  });
}

const pre = extractForm('pretestForm');
const post = extractForm('posttestForm');
const dataDir = path.join(root, 'data');
fs.mkdirSync(dataDir, { recursive: true });

fs.writeFileSync(
  path.join(dataDir, 'pretest.json'),
  JSON.stringify(
    {
      title: 'Pretest',
      description: 'Assess your prerequisite knowledge before the experiment.',
      questions: pre,
    },
    null,
    2
  )
);

fs.writeFileSync(
  path.join(dataDir, 'posttest.json'),
  JSON.stringify(
    {
      title: 'Posttest',
      description: 'Evaluate your understanding after completing the experiment.',
      questions: post,
    },
    null,
    2
  )
);

console.log(`Wrote ${pre.length} pretest + ${post.length} posttest questions`);
