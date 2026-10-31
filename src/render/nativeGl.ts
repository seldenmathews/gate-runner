import * as THREE from 'three';
import { ALLOWED_PIXEL_STORE, GL, isUnsafeTextureUpload } from './glLimits';

const PATCHED = Symbol.for('gate-runner.native-gl');

/**
 * Renderer options every native canvas must use.
 * UnsignedByte output keeps three from allocating the half-float postprocess targets.
 */
export const nativeRendererParameters = {
  antialias: false,
  alpha: false,
  stencil: false,
  premultipliedAlpha: false,
  preserveDrawingBuffer: false,
  powerPreference: 'default' as const,
  outputBufferType: THREE.UnsignedByteType,
  // R3F turns ACES tone mapping on unless this is set, and that allocates half-float targets.
  toneMapping: THREE.NoToneMapping,
  outputColorSpace: THREE.LinearSRGBColorSpace,
};

type GlLike = {
  pixelStorei?: (pname: number, param: number) => void;
  texImage2D?: (...args: unknown[]) => void;
  texSubImage2D?: (...args: unknown[]) => void;
  texStorage2D?: (...args: unknown[]) => void;
  renderbufferStorage?: (...args: unknown[]) => void;
  FLOAT?: number;
  HALF_FLOAT?: number;
  UNSIGNED_BYTE?: number;
  RGBA?: number;
  RGBA8?: number;
};

function bytePixels(width: number, height: number): Uint8Array {
  const w = Math.max(1, width | 0);
  const h = Math.max(1, height | 0);
  return new Uint8Array(w * h * 4);
}

function guardContext(gl: GlLike | null | undefined): void {
  if (!gl || (gl as { __gateRunnerGuarded?: boolean }).__gateRunnerGuarded) return;
  (gl as { __gateRunnerGuarded?: boolean }).__gateRunnerGuarded = true;

  if (typeof gl.pixelStorei === 'function') {
    const pixelStorei = gl.pixelStorei.bind(gl);
    gl.pixelStorei = (pname: number, param: number) => {
      if (ALLOWED_PIXEL_STORE.has(pname)) pixelStorei(pname, param);
    };
  }

  if (typeof gl.texImage2D === 'function') {
    const texImage2D = gl.texImage2D.bind(gl);
    gl.texImage2D = (...args: unknown[]) => {
      if (args.length === 9 && isUnsafeTextureUpload(args[2] as number, args[7] as number)) {
        const width = Number(args[3]) || 1;
        const height = Number(args[4]) || 1;
        texImage2D(
          args[0],
          args[1],
          GL.RGBA8,
          width,
          height,
          args[5],
          GL.RGBA,
          GL.UNSIGNED_BYTE,
          bytePixels(width, height),
        );
        return;
      }
      texImage2D(...args);
    };
  }

  if (typeof gl.texSubImage2D === 'function') {
    const texSubImage2D = gl.texSubImage2D.bind(gl);
    gl.texSubImage2D = (...args: unknown[]) => {
      const type = args.length >= 9 ? (args[7] as number) : (args[5] as number);
      if (isFloatTexel(type)) return;
      texSubImage2D(...args);
    };
  }

  if (typeof gl.texStorage2D === 'function') {
    const texStorage2D = gl.texStorage2D.bind(gl);
    gl.texStorage2D = (...args: unknown[]) => {
      if (isUnsafeTextureUpload(args[2] as number, undefined)) {
        texStorage2D(args[0], args[1], GL.RGBA8, args[3], args[4]);
        return;
      }
      texStorage2D(...args);
    };
  }

  if (typeof gl.renderbufferStorage === 'function') {
    const renderbufferStorage = gl.renderbufferStorage.bind(gl);
    gl.renderbufferStorage = (...args: unknown[]) => {
      if (isUnsafeTextureUpload(args[1] as number, undefined)) {
        renderbufferStorage(args[0], GL.RGBA8, args[2], args[3]);
        return;
      }
      renderbufferStorage(...args);
    };
  }
}

function isFloatTexel(type: number | undefined): boolean {
  return type === GL.FLOAT || type === GL.HALF_FLOAT;
}

function installClock(): void {
  class ExpoClock {
    autoStart: boolean;
    startTime = 0;
    oldTime = 0;
    elapsedTime = 0;
    running = false;

    constructor(autoStart = true) {
      this.autoStart = autoStart;
    }

    start(): void {
      this.startTime = performance.now();
      this.oldTime = this.startTime;
      this.elapsedTime = 0;
      this.running = true;
    }

    stop(): void {
      this.getElapsedTime();
      this.running = false;
      this.autoStart = false;
    }

    getElapsedTime(): number {
      this.getDelta();
      return this.elapsedTime;
    }

    getDelta(): number {
      if (this.autoStart && !this.running) {
        this.start();
        return 0;
      }
      if (!this.running) return 0;
      const now = performance.now();
      const delta = Math.max(0, (now - this.oldTime) / 1000);
      this.oldTime = now;
      this.elapsedTime += delta;
      return delta;
    }
  }

  (THREE as { Clock: unknown }).Clock = ExpoClock;
}

function installRenderer(): void {
  const Original = THREE.WebGLRenderer;

  function ExpoGlRenderer(this: unknown, parameters: THREE.WebGLRendererParameters = {}) {
    const canvas = parameters.canvas as
      { getContext?: (...args: unknown[]) => GlLike | null } | undefined;
    if (
      canvas &&
      typeof canvas.getContext === 'function' &&
      !(canvas as { __gateRunnerGetContext?: boolean }).__gateRunnerGetContext
    ) {
      const getContext = canvas.getContext.bind(canvas);
      canvas.getContext = (...args: unknown[]) => {
        const context = getContext(...args);
        guardContext(context);
        return context;
      };
      (canvas as { __gateRunnerGetContext?: boolean }).__gateRunnerGetContext = true;
    }
    guardContext(parameters.context as GlLike | undefined);

    const renderer = new Original({
      ...parameters,
      ...nativeRendererParameters,
    });
    applyNativeRendererState(renderer);
    return renderer;
  }

  (THREE as { WebGLRenderer: unknown }).WebGLRenderer = ExpoGlRenderer;
}

/**
 * Call once, before @react-three/fiber/native builds a renderer.
 * Patches three's Clock (R3F still constructs one) and the WebGLRenderer
 * so the expo-gl context never sees float targets or unsupported pixelStorei modes.
 */
export function applyNativeRendererState(renderer: THREE.WebGLRenderer): void {
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.autoUpdate = false;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
}

export function installNativeGlGuards(): void {
  const tagged = THREE as typeof THREE & { [PATCHED]?: boolean };
  if (tagged[PATCHED]) return;
  tagged[PATCHED] = true;
  installClock();
  installRenderer();
}
