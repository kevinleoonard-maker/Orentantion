/**
 * Computer Vision: 3x3 Convolution Kernels and image processing
 */

export type KernelType = 'sobel' | 'blur' | 'sharpen' | 'emboss';

export const KERNELS: Record<KernelType, { name: string; matrix: number[][]; divisor: number; desc: string }> = {
  sobel: {
    name: 'Sobel (Rilevamento Bordi)',
    matrix: [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ],
    divisor: 1,
    desc: 'Estrae le variazioni di gradiente per riconoscere i contorni degli oggetti (usato nella guida autonoma).',
  },
  blur: {
    name: 'Sfocatura Gaussiana',
    matrix: [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1],
    ],
    divisor: 16,
    desc: 'Media pesata dei pixel vicini per eliminare il rumore e ammorbidire le transizioni.',
  },
  sharpen: {
    name: 'Nitidezza (Sharpen)',
    matrix: [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ],
    divisor: 1,
    desc: 'Esalta i contrasti locali ad alta frequenza per rendere le immagini più definite.',
  },
  emboss: {
    name: 'Rilievo (Emboss 3D)',
    matrix: [
      [-2, -1, 0],
      [-1, 1, 1],
      [0, 1, 2],
    ],
    divisor: 1,
    desc: 'Simula un effetto di luce radente evidenziando i rilievi tridimensionali.',
  },
};

export function applyConvolution(
  pixels: number[][], // 2D brightness array (0..255)
  kernelMatrix: number[][],
  divisor: number = 1
): number[][] {
  const h = pixels.length;
  const w = pixels[0]?.length || 0;
  const output: number[][] = Array.from({ length: h }, () => new Array(w).fill(0));

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          sum += pixels[y + ky][x + kx] * kernelMatrix[ky + 1][kx + 1];
        }
      }
      const val = Math.max(0, Math.min(255, Math.round(sum / divisor)));
      output[y][x] = val;
    }
  }

  return output;
}
