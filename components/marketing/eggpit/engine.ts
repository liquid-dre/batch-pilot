/**
 * Eggpit — a Three.js "ballpit" restyled as tumbling eggs, adapted from the
 * React Bits Ballpit (JS variant) for our Next 16 / React 19 / TS setup.
 *
 * Three deliberate departures from a stock ballpit:
 *   1. the shared SphereGeometry is vertex-deformed ONCE into a true egg
 *      (elongated + one end tapered narrower), normals recomputed for lighting;
 *   2. each instance gets a fixed random orientation, composed into its matrix
 *      so the eggs point every which way (physics is unchanged);
 *   3. a warm, matte MeshPhysicalMaterial + warm lights so they read as real
 *      eggs, not plastic balls.
 *
 * The physics still treats every instance as a sphere of a single radius — eggs
 * collide as spheres. That is an accepted approximation; the collision system is
 * untouched.
 *
 * This module touches `window`/WebGL and MUST only be imported from the
 * client-only, dynamically-imported canvas chunk (never during SSR/prerender).
 */
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Clock,
  Color,
  Euler,
  InstancedMesh,
  MathUtils,
  Matrix4,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PointLight,
  Quaternion,
  Raycaster,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

export interface EggpitConfig {
  count: number;
  gravity: number;
  friction: number;
  wallBounce: number;
  followCursor: boolean;
  minSize: number;
  maxSize: number;
  /** Egg-shell colours as hex ints (read from CSS tokens by the caller). */
  colors: number[];
  ambientColor: number;
  ambientIntensity: number;
  lightIntensity: number;
  /** Cap on devicePixelRatio for perf. */
  maxDpr: number;
}

export interface EggpitHandle {
  pause(): void;
  resume(): void;
  dispose(): void;
}

const DEFAULTS: EggpitConfig = {
  count: 50,
  gravity: 1,
  friction: 0.928,
  wallBounce: 0.85,
  followCursor: true,
  minSize: 0.7,
  maxSize: 1.35,
  colors: [0xf7f3ea, 0xefe4cf, 0xe2c9a6, 0xb0885f, 0x7a5230],
  ambientColor: 0xfff4e6,
  ambientIntensity: 1.1,
  lightIntensity: 220,
  maxDpr: 2,
};

/** SphereGeometry → egg: elongate on Y, taper the top narrower, fix normals. */
function makeEggGeometry(): SphereGeometry {
  const geo = new SphereGeometry(1, 32, 24);
  const pos = geo.attributes.position;
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // y in [-1,1]; broad end at the bottom, narrow end at the top.
    const t = (v.y + 1) / 2; // 0 bottom → 1 top
    const taper = 1 - 0.24 * t; // 1.0 → 0.76
    v.x *= taper;
    v.z *= taper;
    v.y *= 1.35; // elongate
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/** Simple bounded-box egg physics (gravity toward centre, friction, wall bounce,
 *  pairwise sphere collisions, optional cursor-controlled sphere at index 0). */
class EggPhysics {
  readonly position: Float32Array;
  readonly velocity: Float32Array;
  readonly size: Float32Array;
  half = new Vector3(10, 6, 3);
  center = new Vector3();
  private cfg: EggpitConfig;
  private v0 = new Vector3();
  private v1 = new Vector3();
  private v2 = new Vector3();

  constructor(cfg: EggpitConfig) {
    this.cfg = cfg;
    this.position = new Float32Array(cfg.count * 3);
    this.velocity = new Float32Array(cfg.count * 3);
    this.size = new Float32Array(cfg.count);
    for (let i = 0; i < cfg.count; i++) {
      this.position[i * 3] = MathUtils.randFloatSpread(2 * this.half.x);
      this.position[i * 3 + 1] = MathUtils.randFloatSpread(2 * this.half.y);
      this.position[i * 3 + 2] = MathUtils.randFloatSpread(2 * this.half.z);
      this.velocity[i * 3] = MathUtils.randFloatSpread(2);
      this.velocity[i * 3 + 1] = MathUtils.randFloatSpread(2);
      this.velocity[i * 3 + 2] = MathUtils.randFloatSpread(2);
      this.size[i] = MathUtils.randFloat(cfg.minSize, cfg.maxSize);
    }
    // The control egg (index 0) is a touch larger so the cursor nudges the pile.
    if (cfg.followCursor) this.size[0] = cfg.maxSize * 1.3;
  }

  setBox(x: number, y: number) {
    this.half.set(x, y, this.half.z);
  }

  /** Directly place the cursor-controlled egg (index 0). */
  setControl(p: Vector3) {
    this.position[0] = p.x;
    this.position[1] = p.y;
    this.position[2] = p.z;
    this.velocity[0] = this.velocity[1] = this.velocity[2] = 0;
  }

  update(dt: number) {
    const { gravity, friction, wallBounce, followCursor } = this.cfg;
    const n = this.cfg.count;
    const start = followCursor ? 1 : 0; // index 0 is driven by the cursor
    for (let i = start; i < n; i++) {
      const ix = i * 3;
      this.v0.set(this.position[ix], this.position[ix + 1], this.position[ix + 2]);
      // gravity: gentle pull toward the centre so the eggs hover on screen.
      this.v1.copy(this.center).sub(this.v0).multiplyScalar(gravity * dt * 0.4);
      this.velocity[ix] = (this.velocity[ix] + this.v1.x) * friction;
      this.velocity[ix + 1] = (this.velocity[ix + 1] + this.v1.y) * friction;
      this.velocity[ix + 2] = (this.velocity[ix + 2] + this.v1.z) * friction;
      this.position[ix] += this.velocity[ix] * dt * 6;
      this.position[ix + 1] += this.velocity[ix + 1] * dt * 6;
      this.position[ix + 2] += this.velocity[ix + 2] * dt * 6;
      // walls
      this.bounceAxis(ix, 0, this.half.x, wallBounce);
      this.bounceAxis(ix, 1, this.half.y, wallBounce);
      this.bounceAxis(ix, 2, this.half.z, wallBounce);
    }
    this.collide();
  }

  private bounceAxis(ix: number, axis: 0 | 1 | 2, limit: number, bounce: number) {
    const j = ix + axis;
    const r = this.size[ix / 3];
    if (this.position[j] > limit - r) {
      this.position[j] = limit - r;
      this.velocity[j] *= -bounce;
    } else if (this.position[j] < -limit + r) {
      this.position[j] = -limit + r;
      this.velocity[j] *= -bounce;
    }
  }

  private collide() {
    const n = this.cfg.count;
    for (let i = 0; i < n; i++) {
      const ix = i * 3;
      this.v0.set(this.position[ix], this.position[ix + 1], this.position[ix + 2]);
      for (let k = i + 1; k < n; k++) {
        const kx = k * 3;
        this.v1.set(this.position[kx], this.position[kx + 1], this.position[kx + 2]);
        this.v2.copy(this.v1).sub(this.v0);
        const dist = this.v2.length();
        const minDist = this.size[i] + this.size[k];
        if (dist > 0 && dist < minDist) {
          this.v2.multiplyScalar(1 / dist); // normal
          const overlap = (minDist - dist) / 2;
          const controlI = this.cfg.followCursor && i === 0;
          const controlK = this.cfg.followCursor && k === 0;
          if (!controlI) {
            this.position[ix] -= this.v2.x * overlap;
            this.position[ix + 1] -= this.v2.y * overlap;
            this.position[ix + 2] -= this.v2.z * overlap;
            this.velocity[ix] -= this.v2.x * 0.4;
            this.velocity[ix + 1] -= this.v2.y * 0.4;
            this.velocity[ix + 2] -= this.v2.z * 0.4;
          }
          if (!controlK) {
            this.position[kx] += this.v2.x * overlap;
            this.position[kx + 1] += this.v2.y * overlap;
            this.position[kx + 2] += this.v2.z * overlap;
            this.velocity[kx] += this.v2.x * 0.4;
            this.velocity[kx + 1] += this.v2.y * 0.4;
            this.velocity[kx + 2] += this.v2.z * 0.4;
          }
        }
      }
    }
  }
}

export function createEggpit(canvas: HTMLCanvasElement, partial: Partial<EggpitConfig> = {}): EggpitHandle {
  const cfg: EggpitConfig = { ...DEFAULTS, ...partial };
  const parent = canvas.parentElement ?? document.body;

  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.setClearColor(0x000000, 0); // transparent — the near-black hero shows through

  const scene = new Scene();
  const camera = new PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 20);
  camera.lookAt(0, 0, 0);

  scene.add(new AmbientLight(cfg.ambientColor, cfg.ambientIntensity));
  const key = new PointLight(0xfff1dd, cfg.lightIntensity, 200, 1.4);
  key.position.set(-8, 12, 14);
  scene.add(key);
  const fill = new PointLight(0xffe9cf, cfg.lightIntensity * 0.35, 200, 1.6);
  fill.position.set(10, -6, 10);
  scene.add(fill);

  const geometry = makeEggGeometry();
  const material = new MeshPhysicalMaterial({ roughness: 0.82, metalness: 0, clearcoat: 0.06, clearcoatRoughness: 0.6, sheen: 0.2, envMapIntensity: 0.4 });
  const mesh = new InstancedMesh(geometry, material, cfg.count);
  mesh.instanceMatrix.setUsage(35048 /* DynamicDrawUsage */);
  scene.add(mesh);

  // Fixed random orientation per egg, and per-egg colour.
  const rotations: Quaternion[] = [];
  const color = new Color();
  const palette = cfg.colors.length ? cfg.colors : DEFAULTS.colors;
  const euler = new Euler();
  for (let i = 0; i < cfg.count; i++) {
    euler.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
    rotations.push(new Quaternion().setFromEuler(euler));
    color.setHex(palette[i % palette.length]).convertSRGBToLinear();
    mesh.setColorAt(i, color);
  }
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

  const physics = new EggPhysics(cfg);

  const mat = new Matrix4();
  const scaleVec = new Vector3();
  const posVec = new Vector3();

  // Sizing / frustum → physics box.
  function resize() {
    const w = parent.clientWidth || 1;
    const h = parent.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cfg.maxDpr));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const vFov = (camera.fov * Math.PI) / 180;
    const halfH = Math.tan(vFov / 2) * camera.position.z;
    const halfW = halfH * camera.aspect;
    physics.setBox(halfW, halfH);
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(parent);

  // Cursor control.
  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const planeZ = 0;
  let hasPointer = false;
  function onPointerMove(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const dir = raycaster.ray.direction;
    const origin = raycaster.ray.origin;
    const dist = (planeZ - origin.z) / dir.z;
    posVec.copy(origin).addScaledVector(dir, dist);
    hasPointer = true;
  }
  if (cfg.followCursor) window.addEventListener("pointermove", onPointerMove, { passive: true });

  const clock = new Clock();
  let raf = 0;
  let running = false;

  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 1 / 30);
    if (cfg.followCursor && hasPointer) physics.setControl(posVec);
    physics.update(dt);
    for (let i = 0; i < cfg.count; i++) {
      posVec.set(physics.position[i * 3], physics.position[i * 3 + 1], physics.position[i * 3 + 2]);
      scaleVec.setScalar(physics.size[i]);
      mat.compose(posVec, rotations[i], scaleVec);
      mesh.setMatrixAt(i, mat);
    }
    mesh.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
  }

  function resume() {
    if (running) return;
    running = true;
    clock.start();
    raf = requestAnimationFrame(frame);
  }
  function pause() {
    running = false;
    cancelAnimationFrame(raf);
  }
  resume();

  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true;
    pause();
    ro.disconnect();
    if (cfg.followCursor) window.removeEventListener("pointermove", onPointerMove);
    geometry.dispose();
    material.dispose();
    mesh.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }

  return { pause, resume, dispose };
}
