/**
 * Machine Learning & Classification utilities: Perceptron, KNN, and Decision Boundary
 */

export interface DataPoint {
  id: string;
  x: number; // Normalized 0..1
  y: number; // Normalized 0..1
  category: 0 | 1; // 0 = Team Azure, 1 = Team Amber
}

export interface ModelWeights {
  w1: number;
  w2: number;
  bias: number;
  accuracy: number;
  epochsRun: number;
}

export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));
}

export function trainLinearClassifier(
  points: DataPoint[],
  epochs: number = 60,
  learningRate: number = 0.15
): ModelWeights {
  if (points.length < 2) {
    return { w1: 0, w2: 1, bias: -0.5, accuracy: 0, epochsRun: 0 };
  }

  let w1 = (Math.random() - 0.5) * 0.2;
  let w2 = (Math.random() - 0.5) * 0.2;
  let bias = 0;

  for (let epoch = 0; epoch < epochs; epoch++) {
    for (const p of points) {
      const z = w1 * p.x + w2 * p.y + bias;
      const pred = sigmoid(z);
      const error = p.category - pred;

      w1 += learningRate * error * p.x;
      w2 += learningRate * error * p.y;
      bias += learningRate * error;
    }
  }

  // Calculate training accuracy
  let correct = 0;
  for (const p of points) {
    const z = w1 * p.x + w2 * p.y + bias;
    const predClass = sigmoid(z) >= 0.5 ? 1 : 0;
    if (predClass === p.category) {
      correct++;
    }
  }

  const accuracy = Math.round((correct / points.length) * 100);

  return { w1, w2, bias, accuracy, epochsRun: epochs };
}

export function predictKNN(
  x: number,
  y: number,
  points: DataPoint[],
  k: number = 3
): { category: 0 | 1; confidence: number } {
  if (points.length === 0) return { category: 0, confidence: 0.5 };

  const distances = points.map(p => {
    const dx = p.x - x;
    const dy = p.y - y;
    return {
      category: p.category,
      dist: Math.sqrt(dx * dx + dy * dy),
    };
  });

  distances.sort((a, b) => a.dist - b.dist);
  const topK = distances.slice(0, Math.min(k, distances.length));

  let votes1 = 0;
  for (const item of topK) {
    if (item.category === 1) votes1++;
  }

  const ratio1 = votes1 / topK.length;
  return {
    category: ratio1 >= 0.5 ? 1 : 0,
    confidence: ratio1 >= 0.5 ? ratio1 : (1 - ratio1),
  };
}
