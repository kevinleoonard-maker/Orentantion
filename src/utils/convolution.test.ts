import test from 'node:test';
import assert from 'node:assert/strict';
import { applyConvolution, KERNELS } from './convolution';

test('applyConvolution applies Sobel kernel detecting vertical edge', () => {
  // 5x5 image with sharp vertical line: left 0, right 255
  const img = [
    [0, 0, 255, 255, 255],
    [0, 0, 255, 255, 255],
    [0, 0, 255, 255, 255],
    [0, 0, 255, 255, 255],
    [0, 0, 255, 255, 255],
  ];

  const edge = applyConvolution(img, KERNELS.sobel.matrix, KERNELS.sobel.divisor);
  // Edge at (2,1) or (2,2) should be high
  assert.ok(edge[2][1] > 100 || edge[2][2] > 100);
});
