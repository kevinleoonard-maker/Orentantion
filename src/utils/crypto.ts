/**
 * Cryptography utilities: SHA-256 implementation, Shannon entropy, and crack time estimation
 */

// Pure JS SHA-256 implementation for seamless client and unit-test execution
function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

export function sha256(ascii: string): string {
  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const totalWords = (((ascii.length + 8) >> 6) + 1) * 16;
  const words: number[] = new Array(totalWords).fill(0);
  const asciiBitLength = ascii.length * 8;

  for (let i = 0; i < ascii.length; i++) {
    const code = ascii.charCodeAt(i);
    words[i >> 2] |= (code & 0xff) << (24 - (i % 4) * 8);
  }

  words[ascii.length >> 2] |= 0x80 << (24 - (ascii.length % 4) * 8);
  words[totalWords - 1] = asciiBitLength;

  let result = '';

  for (let j = 0; j < words.length; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = [...hash];

    for (let i = 0; i < 64; i++) {
      if (i >= 16) {
        const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }

      const s1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1 + ch + K[i] + w[i]) | 0;
      const s0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0 + maj) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}

export interface PasswordAnalysis {
  entropyBits: number;
  poolSize: number;
  hasLower: boolean;
  hasUpper: boolean;
  hasDigits: boolean;
  hasSymbols: boolean;
  isCommon: boolean;
  score: 'weak' | 'medium' | 'strong' | 'military';
  crackTimes: {
    mobile: string;      // 10^5 /s
    gpuGaming: string;   // 10^9 /s (RTX 4090)
    gpuCluster: string;  // 10^13 /s (Supercomputer)
    quantumHypothetical: string;
  };
}

const COMMON_PASSWORDS = new Set([
  '123456', 'password', '12345678', 'qwerty', '123456789', '12345',
  '1234', '111111', '1234567', 'dragon', 'admin', 'welcome', 'ciao', 'ciao2010'
]);

export function analyzePassword(password: string): PasswordAnalysis {
  const len = password.length;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigits = /[0-9]/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);
  const isCommon = COMMON_PASSWORDS.has(password.toLowerCase().trim());

  let poolSize = 0;
  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasDigits) poolSize += 10;
  if (hasSymbols) poolSize += 33;

  let entropyBits = 0;
  if (len > 0 && poolSize > 0) {
    entropyBits = Math.round(len * (Math.log2(poolSize)));
  }

  if (isCommon) {
    entropyBits = Math.min(entropyBits, 12);
  }

  let score: 'weak' | 'medium' | 'strong' | 'military' = 'weak';
  if (entropyBits >= 80) score = 'military';
  else if (entropyBits >= 55) score = 'strong';
  else if (entropyBits >= 30) score = 'medium';

  const formatSeconds = (seconds: number): string => {
    if (seconds < 0.001) return '< 1 millisecondo';
    if (seconds < 1) return `${Math.round(seconds * 1000)} millisecondi`;
    if (seconds < 60) return `${Math.round(seconds)} secondi`;
    const minutes = seconds / 60;
    if (minutes < 60) return `${Math.round(minutes)} minuti`;
    const hours = minutes / 60;
    if (hours < 24) return `${Math.round(hours)} ore`;
    const days = hours / 24;
    if (days < 365) return `${Math.round(days)} giorni`;
    const years = days / 365;
    if (years < 1000) return `${Math.round(years)} anni`;
    if (years < 1000000) return `${(years / 1000).toFixed(1)} mila anni`;
    if (years < 1e9) return `${(years / 1e6).toFixed(1)} milioni di anni`;
    return `${(years / 1e9).toFixed(1)} miliardi di anni`;
  };

  const combinations = Math.pow(poolSize || 1, len);
  const mobileSec = combinations / 1e5;
  const gpuSec = combinations / 1e9;
  const clusterSec = combinations / 1e13;

  return {
    entropyBits,
    poolSize,
    hasLower,
    hasUpper,
    hasDigits,
    hasSymbols,
    isCommon,
    score,
    crackTimes: {
      mobile: isCommon ? '< 1 millisecondo' : formatSeconds(mobileSec),
      gpuGaming: isCommon ? '< 1 millisecondo' : formatSeconds(gpuSec),
      gpuCluster: isCommon ? '< 1 millisecondo' : formatSeconds(clusterSec),
      quantumHypothetical: entropyBits >= 100 ? 'Resistente a Grover (2^50+)' : (isCommon ? 'Istantaneo' : formatSeconds(Math.sqrt(combinations) / 1e9)),
    },
  };
}
