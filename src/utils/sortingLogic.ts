/**
 * Sorting algorithm simulation generator for step-by-step visual learning
 */

export interface SortStep {
  array: number[];
  comparingIndices: [number, number] | null;
  swappedIndices: [number, number] | null;
  sortedIndices: number[];
  comparisons: number;
  swaps: number;
}

export function generateBubbleSortSteps(initialArray: number[]): SortStep[] {
  const arr = [...initialArray];
  const steps: SortStep[] = [];
  let comparisons = 0;
  let swaps = 0;
  const n = arr.length;
  const sorted: number[] = [];

  steps.push({
    array: [...arr],
    comparingIndices: null,
    swappedIndices: null,
    sortedIndices: [],
    comparisons,
    swaps,
  });

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      steps.push({
        array: [...arr],
        comparingIndices: [j, j + 1],
        swappedIndices: null,
        sortedIndices: [...sorted],
        comparisons,
        swaps,
      });

      if (arr[j] > arr[j + 1]) {
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        swaps++;

        steps.push({
          array: [...arr],
          comparingIndices: [j, j + 1],
          swappedIndices: [j, j + 1],
          sortedIndices: [...sorted],
          comparisons,
          swaps,
        });
      }
    }
    sorted.push(n - i - 1);
  }
  sorted.push(0);

  steps.push({
    array: [...arr],
    comparingIndices: null,
    swappedIndices: null,
    sortedIndices: Array.from({ length: n }, (_, idx) => idx),
    comparisons,
    swaps,
  });

  return steps;
}
