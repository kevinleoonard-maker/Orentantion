/**
 * Neuroevolution / Genetic Algorithm and Neural Network for Flappy AI
 */

export interface NeuralNetwork {
  inputWeights: number[][];  // 4 inputs x 4 hidden
  hiddenBiases: number[];    // 4 hidden
  outputWeights: number[];   // 4 hidden x 1 output
  outputBias: number;        // 1 output
}

export function createRandomBrain(): NeuralNetwork {
  const rand = () => (Math.random() * 2 - 1);
  const inputWeights: number[][] = [];
  for (let i = 0; i < 4; i++) {
    inputWeights.push([rand(), rand(), rand(), rand()]);
  }
  return {
    inputWeights,
    hiddenBiases: [rand(), rand(), rand(), rand()],
    outputWeights: [rand(), rand(), rand(), rand()],
    outputBias: rand(),
  };
}

export function cloneBrain(brain: NeuralNetwork): NeuralNetwork {
  return {
    inputWeights: brain.inputWeights.map(row => [...row]),
    hiddenBiases: [...brain.hiddenBiases],
    outputWeights: [...brain.outputWeights],
    outputBias: brain.outputBias,
  };
}

export function mutateBrain(brain: NeuralNetwork, mutationRate: number = 0.15): NeuralNetwork {
  const mutated = cloneBrain(brain);
  const mutateVal = (val: number) => {
    if (Math.random() < mutationRate) {
      return val + (Math.random() * 0.4 - 0.2);
    }
    return val;
  };

  mutated.inputWeights = mutated.inputWeights.map(row => row.map(mutateVal));
  mutated.hiddenBiases = mutated.hiddenBiases.map(mutateVal);
  mutated.outputWeights = mutated.outputWeights.map(mutateVal);
  mutated.outputBias = mutateVal(mutated.outputBias);

  return mutated;
}

export function forwardBrain(brain: NeuralNetwork, inputs: [number, number, number, number]): { shouldJump: boolean; activation: number; hiddenActivations: number[] } {
  // inputs: [birdY_norm, birdVel_norm, pipeDist_norm, pipeGapY_norm]
  const hiddenActivations: number[] = [];

  for (let h = 0; h < 4; h++) {
    let sum = brain.hiddenBiases[h];
    for (let i = 0; i < 4; i++) {
      sum += inputs[i] * brain.inputWeights[i][h];
    }
    // Tanh activation (-1 to 1)
    hiddenActivations.push(Math.tanh(sum));
  }

  let outputSum = brain.outputBias;
  for (let h = 0; h < 4; h++) {
    outputSum += hiddenActivations[h] * brain.outputWeights[h];
  }

  // Sigmoid activation (0 to 1)
  const activation = 1 / (1 + Math.exp(-outputSum));
  return {
    shouldJump: activation > 0.5,
    activation,
    hiddenActivations,
  };
}

export interface Agent {
  id: number;
  y: number;
  vy: number;
  alive: boolean;
  score: number;
  fitness: number;
  brain: NeuralNetwork;
}

export function createPopulation(size: number = 20): Agent[] {
  return Array.from({ length: size }, (_, i) => ({
    id: i,
    y: 200,
    vy: 0,
    alive: true,
    score: 0,
    fitness: 0,
    brain: createRandomBrain(),
  }));
}

export function evolveNextGeneration(currentPopulation: Agent[], mutationRate: number = 0.15): Agent[] {
  // Sort by fitness descending
  const sorted = [...currentPopulation].sort((a, b) => b.fitness - a.fitness);
  const bestBrain = sorted[0]?.brain || createRandomBrain();
  const runnerUp = sorted[1]?.brain || bestBrain;

  const nextGen: Agent[] = [];
  const size = currentPopulation.length;

  // Elitism: keep best brain untouched
  nextGen.push({
    id: 0,
    y: 200,
    vy: 0,
    alive: true,
    score: 0,
    fitness: 0,
    brain: cloneBrain(bestBrain),
  });

  // Offspring from best and runnerUp with mutations
  for (let i = 1; i < size; i++) {
    const parent = Math.random() < 0.7 ? bestBrain : runnerUp;
    nextGen.push({
      id: i,
      y: 200,
      vy: 0,
      alive: true,
      score: 0,
      fitness: 0,
      brain: mutateBrain(parent, mutationRate),
    });
  }

  return nextGen;
}
