import type { DroneState } from './telemetry';

export function loadDroneModel(buffer: ArrayBuffer): Promise<unknown>;

export function createDroneScene(options: {
  canvas: HTMLCanvasElement;
  anchor: HTMLElement | null;
  model?: unknown;
  route?: { lanes: ArrayLike<Element>; landing: Element | null } | null;
  /** la home page (lo hero): il drone si può prendere e spostare solo mentre occupa lo schermo; null = ovunque */
  home?: Element | null;
  /** chiamata una volta, dopo il primo fotogramma disegnato */
  onFirstFrame?: (() => void) | null;
  /** chiamata a ogni fotogramma con lo stato del drone (strumentazione di volo, lib/telemetry.ts) */
  onTelemetry?: ((state: DroneState) => void) | null;
}): () => void;
