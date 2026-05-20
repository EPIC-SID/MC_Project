import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(root, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

html = html.replace(
  /<form id="pretestForm" class="quiz-form">[\s\S]*?<\/form>/,
  '<form id="pretestForm" class="quiz-form" aria-live="polite"></form>'
);

html = html.replace(
  /<form id="posttestForm" class="quiz-form">[\s\S]*?<\/form>/,
  '<form id="posttestForm" class="quiz-form" aria-live="polite"></form>'
);

fs.writeFileSync(htmlPath, html);
console.log('Slimmed quiz forms in index.html');
