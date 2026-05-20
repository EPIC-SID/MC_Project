import nerdamer from 'nerdamer';
import 'nerdamer/Algebra.js';
import 'nerdamer/Calculus.js';

if (typeof globalThis !== 'undefined') {
  globalThis.nerdamer = nerdamer;
}

export { nerdamer };
