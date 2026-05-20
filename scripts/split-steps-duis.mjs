import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'js/steps/steps-double.js');
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

const header = `import { toNerd, nSub } from '../core/parser.js';
import { nerdamer } from '../core/nerdamer-setup.js';

`;

const body = lines
  .slice(2, 306)
  .join('\n')
  .replace("if (typeof nerdamer === 'undefined') return null;\n\n", '');

fs.writeFileSync(path.join(root, 'js/steps/steps-duis.js'), header + body);

const rest =
  `${lines[0]}
${lines[1]}
import { buildDUISSteps } from './steps-duis.js';

${lines.slice(306).join('\n')}`;

fs.writeFileSync(file, rest);
console.log('Created steps-duis.js and updated steps-double.js');
