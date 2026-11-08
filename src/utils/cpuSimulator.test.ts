import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialCPU, stepCPU, Instruction } from './cpuSimulator';

test('CPU executes LDA and ADD program through full machine cycle', () => {
  // RAM: Address 10 has 15, Address 11 has 25
  const initialRAM = new Array(16).fill(0);
  initialRAM[10] = 15;
  initialRAM[11] = 25;

  const program: Instruction[] = [
    { op: 'LDA', operand: 10 },
    { op: 'ADD', operand: 11 },
    { op: 'STA', operand: 12 },
    { op: 'HLT', operand: 0 },
  ];

  let cpu = createInitialCPU(initialRAM);

  // Run steps until halted (or max 20 steps)
  for (let s = 0; s < 20 && cpu.stage !== 'HALTED'; s++) {
    cpu = stepCPU(cpu, program);
  }

  assert.equal(cpu.stage, 'HALTED');
  assert.equal(cpu.acc, 40); // 15 + 25
  assert.equal(cpu.ram[12], 40); // Stored in RAM[12]
});
