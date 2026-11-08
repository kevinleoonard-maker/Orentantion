import test from 'node:test';
import assert from 'node:assert/strict';
import { charToByte, bitsToByte, toggleBit, applyBitwise } from './binary';

test('charToByte converts ASCII A correctly', () => {
  const byte = charToByte('A');
  assert.equal(byte.code, 65);
  assert.equal(byte.hex, '0x41');
  // 65 is 64 + 1 -> 01000001
  assert.deepEqual(byte.bits, [false, true, false, false, false, false, false, true]);
});

test('toggleBit flips the requested bit', () => {
  const byte = charToByte('A'); // 01000001
  // Flip bit 2 (weight 32) -> 65 + 32 = 97 ('a')
  const flipped = toggleBit(byte.bits, 2);
  const nextByte = bitsToByte(flipped);
  assert.equal(nextByte.code, 97);
  assert.equal(nextByte.char, 'a');
});

test('applyBitwise converts lowercase to uppercase with AND 0xDF', () => {
  const byte = charToByte('a'); // 97
  const upperBits = applyBitwise(byte.bits, 'AND', 0xDF);
  const upperByte = bitsToByte(upperBits);
  assert.equal(upperByte.char, 'A');
  assert.equal(upperByte.code, 65);
});
