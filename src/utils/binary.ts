/**
 * Pure logic for binary / ASCII transformations and bitwise operations
 */

export interface ByteRepresentation {
  char: string;
  code: number;
  hex: string;
  bits: boolean[]; // 8 bits: MSB (index 0, weight 128) to LSB (index 7, weight 1)
}

export function charToByte(char: string): ByteRepresentation {
  const code = (char && char.length > 0) ? char.charCodeAt(0) % 256 : 0;
  const bits: boolean[] = [];
  for (let i = 7; i >= 0; i--) {
    bits.push(((code >> i) & 1) === 1);
  }
  return {
    char: String.fromCharCode(code),
    code,
    hex: '0x' + code.toString(16).toUpperCase().padStart(2, '0'),
    bits,
  };
}

export function bitsToByte(bits: boolean[]): ByteRepresentation {
  let code = 0;
  for (let i = 0; i < 8; i++) {
    if (bits[i]) {
      code |= (1 << (7 - i));
    }
  }
  return {
    char: code >= 32 && code <= 126 ? String.fromCharCode(code) : '·',
    code,
    hex: '0x' + code.toString(16).toUpperCase().padStart(2, '0'),
    bits: [...bits],
  };
}

export function toggleBit(bits: boolean[], bitIndex: number): boolean[] {
  const next = [...bits];
  if (bitIndex >= 0 && bitIndex < 8) {
    next[bitIndex] = !next[bitIndex];
  }
  return next;
}

export function applyBitwise(bits: boolean[], op: 'AND' | 'OR' | 'XOR', mask: number): boolean[] {
  let code = 0;
  for (let i = 0; i < 8; i++) {
    if (bits[i]) {
      code |= (1 << (7 - i));
    }
  }

  let result = code;
  if (op === 'AND') result = code & mask;
  if (op === 'OR') result = code | mask;
  if (op === 'XOR') result = code ^ mask;

  const nextBits: boolean[] = [];
  for (let i = 7; i >= 0; i--) {
    nextBits.push(((result >> i) & 1) === 1);
  }
  return nextBits;
}
