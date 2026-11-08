import test from 'node:test';
import assert from 'node:assert/strict';
import { sha256, analyzePassword } from './crypto';

test('sha256 computes correct standard hash for empty string and text', () => {
  // SHA-256 for "" is e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
  assert.equal(sha256(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');

  // Avalanche effect test: 'Vallauri' vs 'Vallauri!' must differ significantly
  const h1 = sha256('Vallauri');
  const h2 = sha256('Vallauri!');
  assert.equal(h1.length, 64);
  assert.equal(h2.length, 64);
  assert.notEqual(h1, h2);
});

test('analyzePassword identifies common passwords and calculates entropy', () => {
  const common = analyzePassword('123456');
  assert.equal(common.isCommon, true);
  assert.equal(common.score, 'weak');

  const strong = analyzePassword('C4vallo-Batt3ria-Luna-42!');
  assert.equal(strong.hasLower, true);
  assert.equal(strong.hasUpper, true);
  assert.equal(strong.hasDigits, true);
  assert.equal(strong.hasSymbols, true);
  assert.ok(strong.entropyBits >= 80);
  assert.equal(strong.score, 'military');
});
