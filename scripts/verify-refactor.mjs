import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=fs.readFileSync(path.join(root,'dist/index.html'));
const actual=crypto.createHash('sha256').update(html).digest('hex');
const expected=fs.readFileSync(path.join(root,'src/refactor-baseline.sha256'),'utf8').trim();
assert.equal(actual,expected,'HTML differs from the pre-split reference build. This command is for the current refactor only; do not update the reference after intentional gameplay changes.');
console.log('PASS: refactor preserved HTML exactly ('+html.byteLength+' bytes), sha256 '+actual);
