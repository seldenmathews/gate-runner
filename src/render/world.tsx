import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { colors, opColor } from '../theme';
import { gateLabel } from '../sim/math';
import type { GameState, Level, PickupKind } from '../sim/types';
import { buildGlyphGeometry } from './glyphs';

function hash(n: number): number {
  let t = (n + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function Road({ level }: { level: Level }) {
  const length = level.length + 36;
  const half = level.roadHalfWidth;
  const dashes = Math.ceil(level.length / 4);
  const dash = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const mesh = dash.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < dashes; i += 1) {
      dummy.position.set(0, 0.02, -(i * 4 + 2));
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.count = dashes;
    mesh.instanceMatrix.needsUpdate = true;
  }, [dashes]);

  return (
    <group>
      <mesh position={[0, -0.16, -length / 2]} frustumCulled={false}>
        <boxGeometry args={[half * 2, 0.28, length]} />
        <meshStandardMaterial color={colors.road} roughness={0.95} metalness={0.02} />
      </mesh>
      <instancedMesh ref={dash} args={[undefined, undefined, dashes]} frustumCulled={false}>
        <boxGeometry args={[0.08, 0.03, 1.15]} />
        <meshStandardMaterial color={colors.rail} emissive={colors.rail} emissiveIntensity={0.35} />
      </instancedMesh>
      <mesh position={[-half + 0.08, 0.2, -length / 2]} frustumCulled={false}>
        <boxGeometry args={[0.12, 0.38, length]} />
        <meshStandardMaterial
          color={colors.cyan}
          emissive={colors.cyan}
          emissiveIntensity={0.85}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[half - 0.08, 0.2, -length / 2]} frustumCulled={false}>
        <boxGeometry args={[0.12, 0.38, length]} />
        <meshStandardMaterial
          color={colors.gold}
          emissive={colors.gold}
          emissiveIntensity={0.55}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export function City({ level }: { level: Level }) {
  const count = 96;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const seed = useMemo(() => {
    let h = 2166136261;
    for (let i = 0; i < level.id.length; i += 1) {
      h ^= level.id.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }, [level.id]);

  useEffect(() => {
    const inst = mesh.current;
    if (!inst) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < count; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const r1 = hash(seed + i * 17);
      const r2 = hash(seed + i * 29);
      const r3 = hash(seed + i * 47);
      const w = 1.6 + r1 * 2.4;
      const d = 1.5 + r2 * 2.6;
      const h = 4 + r3 * r3 * 24;
      const x = side * (level.roadHalfWidth + 2.4 + r1 * 7 + w);
      const z = -((i * level.length) / count);
      dummy.position.set(x, -1.2 - h / 2, z);
      dummy.scale.set(w, h, d);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      color.setRGB(0.08 + r2 * 0.08, 0.1 + r1 * 0.08, 0.16 + r3 * 0.12);
      inst.setColorAt(i, color);
    }
    inst.count = count;
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  }, [count, level.length, level.roadHalfWidth, seed]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ffffff" roughness={0.85} metalness={0.04} />
    </instancedMesh>
  );
}

function GateFrame({ width, material }: { width: number; material: THREE.Material }) {
  const height = 3.2;
  const post = 0.16;
  return (
    <group>
      <mesh position={[-width / 2, height / 2, 0]} material={material}>
        <boxGeometry args={[post, height, post]} />
      </mesh>
      <mesh position={[width / 2, height / 2, 0]} material={material}>
        <boxGeometry args={[post, height, post]} />
      </mesh>
      <mesh position={[0, height, 0]} material={material}>
        <boxGeometry args={[width + post, post, post]} />
      </mesh>
      <mesh position={[0, 0.22, 0]} material={material}>
        <boxGeometry args={[width + post, 0.1, post]} />
      </mesh>
    </group>
  );
}

function GlyphText({ text }: { text: string }) {
  const geometry = useMemo(() => buildGlyphGeometry(text), [text]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} position={[0, 1.72, 0.2]} scale={1.55}>
      <meshBasicMaterial color={colors.ink} toneMapped={false} />
    </mesh>
  );
}

function GateVisual({ id, state }: { id: string; state: GameState }) {
  const initial = state.gates.find((gate) => gate.id === id);
  const [label, setLabel] = useState(() => (initial ? gateLabel(initial.op, initial.value) : ''));
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: colors.ink,
        emissive: colors.ink,
        emissiveIntensity: 0.9,
        roughness: 0.38,
        metalness: 0.08,
        toneMapped: false,
      }),
    [],
  );
  const ghostMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ff4ad8',
        transparent: true,
        opacity: 0.42,
        toneMapped: false,
      }),
    [],
  );
  useEffect(
    () => () => {
      material.dispose();
      ghostMaterial.dispose();
    },
    [ghostMaterial, material],
  );
  const ghost = useRef<THREE.Group>(null);
  const bar = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const gate = state.gates.find((item) => item.id === id);
    if (!gate) return;
    const next = gateLabel(gate.op, gate.value);
    setLabel((current) => (current === next ? current : next));
    const color = opColor[gate.op];
    material.color.set(color);
    material.emissive.set(color);
    const pulse = gate.rigged && !gate.flipped ? 0.25 + Math.sin(clock.elapsedTime * 22) * 0.2 : 0;
    material.emissiveIntensity = (gate.consumed ? 0.28 : 0.95) + pulse;
    if (ghost.current) {
      const show = gate.rigged && !gate.flipped;
      ghost.current.visible = show;
      ghost.current.position.x = Math.sin(clock.elapsedTime * 30) * 0.08;
    }
    if (bar.current) {
      const show = gate.rigged && !gate.flipped;
      bar.current.visible = show;
      const ratio = gate.hitsToFlip <= 0 ? 0 : gate.hits / gate.hitsToFlip;
      bar.current.scale.x = Math.max(0.05, ratio);
    }
  });

  if (!initial) return null;
  const width = initial.halfWidth * 1.86;
  return (
    <group position={[initial.x, 0, -initial.z]}>
      <GateFrame width={width} material={material} />
      <group ref={ghost} visible={initial.rigged}>
        <GateFrame width={width + 0.22} material={ghostMaterial} />
      </group>
      <mesh ref={bar} position={[0, 3.48, 0]} visible={initial.rigged}>
        <boxGeometry args={[width * 0.72, 0.08, 0.08]} />
        <meshBasicMaterial color={colors.cyan} toneMapped={false} />
      </mesh>
      <GlyphText text={label} />
    </group>
  );
}

export function Gates({ state }: { state: GameState }) {
  return (
    <group>
      {state.gates.map((gate) => (
        <GateVisual key={gate.id} id={gate.id} state={state} />
      ))}
    </group>
  );
}

const PICKUP_COLOR: Record<PickupKind, string> = {
  gold: colors.gold,
  rate: colors.cyan,
  damage: colors.danger,
};

function PickupVisual({ id, state }: { id: string; state: GameState }) {
  const initial = state.pickups.find((pickup) => pickup.id === id);
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const pickup = state.pickups.find((item) => item.id === id);
    if (!pickup || !group.current) return;
    group.current.visible = !pickup.taken;
    group.current.rotation.y = clock.elapsedTime * 1.8;
    group.current.position.y = 0.72 + Math.sin(clock.elapsedTime * 3 + pickup.z) * 0.08;
  });
  if (!initial) return null;
  const color = PICKUP_COLOR[initial.kind];
  return (
    <group ref={group} position={[initial.x, 0.72, -initial.z]}>
      <mesh>
        {initial.kind === 'gold' ? <octahedronGeometry args={[0.28, 0]} /> : null}
        {initial.kind === 'rate' ? <torusGeometry args={[0.22, 0.07, 6, 12]} /> : null}
        {initial.kind === 'damage' ? <icosahedronGeometry args={[0.26, 0]} /> : null}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.85}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export function Pickups({ state }: { state: GameState }) {
  return (
    <group>
      {state.pickups.map((pickup) => (
        <PickupVisual key={pickup.id} id={pickup.id} state={state} />
      ))}
    </group>
  );
}

export function Finale({ state }: { state: GameState }) {
  const group = useRef<THREE.Group>(null);
  const bar = useRef<THREE.Mesh>(null);
  const finale = state.finale;
  useFrame(() => {
    if (!group.current || !bar.current) return;
    const show = state.squad.z > state.length - 70 || state.phase !== 'run';
    group.current.visible = show;
    const ratio = state.finale.maxHp <= 0 ? 0 : state.finale.hp / state.finale.maxHp;
    bar.current.scale.x = Math.max(0.02, ratio);
  });
  return (
    <group ref={group} position={[finale.x, 0, -finale.z]} visible={false}>
      <mesh position={[0, 1.15, 0.8]}>
        <boxGeometry args={[finale.kind === 'boss' ? 7.2 : 8.2, 2.3, 0.45]} />
        <meshStandardMaterial color="#3a2a32" roughness={0.7} />
      </mesh>
      <mesh position={[-3.1, 1.15, 0.8]}>
        <boxGeometry args={[0.35, 2.5, 0.5]} />
        <meshStandardMaterial color="#6a3038" />
      </mesh>
      <mesh position={[3.1, 1.15, 0.8]}>
        <boxGeometry args={[0.35, 2.5, 0.5]} />
        <meshStandardMaterial color="#6a3038" />
      </mesh>
      {finale.kind === 'boss' ? (
        <group position={[0, 0, -0.4]}>
          <mesh position={[0, 1.15, 0]}>
            <boxGeometry args={[1.5, 1.7, 0.9]} />
            <meshStandardMaterial
              color={colors.boss}
              emissive={colors.boss}
              emissiveIntensity={0.35}
            />
          </mesh>
          <mesh position={[0, 2.25, 0]}>
            <boxGeometry args={[0.7, 0.55, 0.6]} />
            <meshStandardMaterial color="#ffd0b0" />
          </mesh>
          <mesh position={[0.85, 1.2, 0.2]}>
            <boxGeometry args={[0.28, 0.9, 0.28]} />
            <meshStandardMaterial color={colors.boss} />
          </mesh>
          <mesh position={[-0.85, 1.2, 0.2]}>
            <boxGeometry args={[0.28, 0.9, 0.28]} />
            <meshStandardMaterial color={colors.boss} />
          </mesh>
        </group>
      ) : null}
      <mesh ref={bar} position={[0, 3.15, 0]}>
        <boxGeometry args={[3.4, 0.12, 0.12]} />
        <meshBasicMaterial color={colors.danger} toneMapped={false} />
      </mesh>
    </group>
  );
}
