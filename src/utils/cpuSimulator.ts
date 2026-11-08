/**
 * Von Neumann Architecture Micro-Processor Simulator
 */

export type OpCode = 'LDA' | 'ADD' | 'SUB' | 'STA' | 'JMP' | 'HLT';

export interface Instruction {
  op: OpCode;
  operand: number; // 0..15 address or value
}

export interface CPUState {
  pc: number;          // Program Counter (0..15)
  ir: Instruction | null; // Instruction Register
  acc: number;         // Accumulator Register (-128..255)
  ram: number[];       // 16 bytes of memory
  stage: 'FETCH' | 'DECODE' | 'EXECUTE' | 'HALTED';
  busValue: number | null;
  busSource: string | null;
  busTarget: string | null;
  stepCount: number;
}

export function createInitialCPU(initialRAM?: number[]): CPUState {
  const ram = new Array(16).fill(0);
  if (initialRAM) {
    for (let i = 0; i < Math.min(16, initialRAM.length); i++) {
      ram[i] = initialRAM[i];
    }
  }
  return {
    pc: 0,
    ir: null,
    acc: 0,
    ram,
    stage: 'FETCH',
    busValue: null,
    busSource: null,
    busTarget: null,
    stepCount: 0,
  };
}

export function stepCPU(state: CPUState, program: Instruction[]): CPUState {
  if (state.stage === 'HALTED') return state;

  const next = {
    ...state,
    ram: [...state.ram],
    stepCount: state.stepCount + 1,
  };

  if (state.stage === 'FETCH') {
    const inst = program[state.pc] || { op: 'HLT', operand: 0 };
    next.ir = inst;
    next.stage = 'DECODE';
    next.busValue = state.pc;
    next.busSource = 'PC';
    next.busTarget = 'RAM';
    return next;
  }

  if (state.stage === 'DECODE') {
    next.stage = 'EXECUTE';
    next.busValue = state.ir?.operand ?? 0;
    next.busSource = 'DECODER';
    next.busTarget = 'ALU';
    return next;
  }

  if (state.stage === 'EXECUTE') {
    const inst = state.ir;
    if (!inst || inst.op === 'HLT') {
      next.stage = 'HALTED';
      next.busValue = null;
      return next;
    }

    let nextPC = state.pc + 1;

    switch (inst.op) {
      case 'LDA':
        next.acc = next.ram[inst.operand] ?? 0;
        next.busValue = next.acc;
        next.busSource = `RAM[${inst.operand}]`;
        next.busTarget = 'ACC';
        break;

      case 'ADD': {
        const val = next.ram[inst.operand] ?? 0;
        next.acc = (next.acc + val) & 0xff;
        next.busValue = val;
        next.busSource = `RAM[${inst.operand}]`;
        next.busTarget = 'ALU';
        break;
      }

      case 'SUB': {
        const val = next.ram[inst.operand] ?? 0;
        next.acc = (next.acc - val) & 0xff;
        next.busValue = val;
        next.busSource = `RAM[${inst.operand}]`;
        next.busTarget = 'ALU';
        break;
      }

      case 'STA':
        next.ram[inst.operand] = next.acc;
        next.busValue = next.acc;
        next.busSource = 'ACC';
        next.busTarget = `RAM[${inst.operand}]`;
        break;

      case 'JMP':
        nextPC = inst.operand;
        next.busValue = nextPC;
        next.busSource = 'DECODER';
        next.busTarget = 'PC';
        break;
    }

    next.pc = nextPC % 16;
    next.stage = 'FETCH';
    return next;
  }

  return next;
}
