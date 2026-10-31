import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RefObject } from 'react';
import { autoTarget } from '../sim/auto';
import { MAX_PROJECTILES, MAX_SQUAD } from '../sim/constants';
import { step } from '../sim/step';
import type { GameState, Level, SimInput } from '../sim/types';
import { hudKey, toHud, type HudSnapshot } from '../game/snapshot';
import { colors } from '../theme';
import {
  createEnemyGeometry,
  createSoldierGeometry,
  createVisorGeometry,
  writeEnemies,
  writeProjectiles,
  writeSquad,
} from './geometry';
import { MAX_PARTICLES, ParticleField } from './particles';
import { presentEvents } from './present';
import { LitMaterial } from './materials';
import { City, Finale, Gates, Pickups, Road } from './world';

interface SceneProps {
  state: GameState;
  inputRef: RefObject<SimInput>;
  pausedRef: RefObject<boolean>;
  autodrive: boolean;
  level: Level;
  onHud: (hud: HudSnapshot, flash: string | null) => void;
}

const desired = new THREE.Vector3();
const look = new THREE.Vector3();

export function Scene({ state, inputRef, pausedRef, autodrive, level, onHud }: SceneProps) {
  const body = useRef<THREE.InstancedMesh>(null);
  const visor = useRef<THREE.InstancedMesh>(null);
  const enemies = useRef<THREE.InstancedMesh>(null);
  const shots = useRef<THREE.InstancedMesh>(null);
  const bits = useRef<THREE.InstancedMesh>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const particles = useRef<ParticleField | null>(null);
  if (particles.current === null) particles.current = new ParticleField();
  const hudCache = useRef('');
  const booted = useRef(false);
  const trauma = useRef(0);
  const fps = useRef({ frames: 0, last: 0, value: 0 });
  const lookTarget = useRef(new THREE.Vector3(0, 1, 12));
  const onHudRef = useRef(onHud);
  useEffect(() => {
    onHudRef.current = onHud;
  }, [onHud]);

  const soldierGeo = useMemo(() => createSoldierGeometry(), []);
  const visorGeo = useMemo(() => createVisorGeometry(), []);
  const enemyGeo = useMemo(() => createEnemyGeometry(), []);
  const shotGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const bitGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  useEffect(
    () => () => {
      soldierGeo.dispose();
      visorGeo.dispose();
      enemyGeo.dispose();
      shotGeo.dispose();
      bitGeo.dispose();
    },
    [bitGeo, enemyGeo, shotGeo, soldierGeo, visorGeo],
  );

  useEffect(() => {
    const mesh = body.current;
    if (!mesh) return;
    const color = new THREE.Color();
    for (let i = 0; i < MAX_SQUAD; i += 1) {
      const shade = 0.92 + (i % 6) * 0.03;
      color.setRGB(shade, shade * 0.9, shade * 0.72);
      mesh.setColorAt(i, color);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  useEffect(() => {
    const mesh = enemies.current;
    if (!mesh) return;
    const color = new THREE.Color();
    const total = state.enemies.length;
    for (let i = 0; i < total; i += 1) {
      const shade = 0.75 + (i % 4) * 0.08;
      color.setRGB(shade, shade * 0.22, shade * 0.32);
      mesh.setColorAt(i, color);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [state.enemies.length]);

  useFrame((root, dt) => {
    const field = particles.current;
    if (!field) return;
    const stepDt = Math.min(0.033, Math.max(0, dt));
    if (!pausedRef.current && state.phase !== 'won' && state.phase !== 'lost') {
      if (autodrive) inputRef.current.targetX = autoTarget(state);
      step(state, inputRef.current, stepDt);
      presentEvents(state.events, state.time, state.squad, field, (amount) => {
        trauma.current = Math.min(1, trauma.current + amount);
      });
    } else if (pausedRef.current) {
      state.events = [];
    }

    const time = root.clock.elapsedTime;
    writeSquad(body.current, state.squad.count, state.squad.x, state.squad.z, time);
    writeSquad(visor.current, state.squad.count, state.squad.x, state.squad.z, time);
    writeEnemies(enemies.current, state.enemies, time);
    writeProjectiles(shots.current, state.projectiles);
    field.mesh = bits.current;
    field.update(stepDt);

    if (shadow.current) {
      const span = 0.55 + Math.sqrt(Math.max(1, state.squad.count)) * 0.16;
      shadow.current.position.set(state.squad.x, 0.03, -(state.squad.z - 0.2));
      shadow.current.scale.set(span, 1, span * 0.72);
    }

    trauma.current = Math.max(0, trauma.current - stepDt * 1.7);
    const shake = trauma.current * trauma.current;
    const sx = Math.sin(time * 42) * shake * 0.38;
    const sy = Math.cos(time * 37) * shake * 0.22;
    const finale = state.phase !== 'run';
    // The world group is mirrored on Z so the camera looks down -Z.
    // Three.js puts +X on the right in that direction, which matches drag-left.
    const ahead = -state.squad.z;
    desired.set(
      state.squad.x * 0.22 + sx,
      (finale ? 8.1 : 6.25) + sy,
      ahead + (finale ? 16.2 : 12.4),
    );
    look.set(state.squad.x * 0.4, finale ? 1.45 : 1.02, ahead - (finale ? 7.5 : 10.5));
    const camera = root.camera;
    if (!booted.current) {
      camera.position.copy(desired);
      lookTarget.current.copy(look);
      booted.current = true;
    } else {
      const blend = 1 - Math.exp(-5.5 * stepDt);
      camera.position.lerp(desired, blend);
      lookTarget.current.lerp(look, blend);
    }
    camera.lookAt(lookTarget.current);

    fps.current.frames += 1;
    if (time - fps.current.last > 0.5) {
      fps.current.value = Math.round(fps.current.frames / (time - fps.current.last));
      fps.current.frames = 0;
      fps.current.last = time;
    }
    const hud = toHud(state, level, fps.current.value);
    const key = hudKey(hud);
    const flip = state.events.find((event) => event.type === 'flip');
    const flash = flip && flip.type === 'flip' ? `FLIPPED ${flip.text}` : null;
    if (key !== hudCache.current || flash) {
      hudCache.current = key;
      onHudRef.current(hud, flash);
    }
    state.events = [];
  });

  const enemyCount = Math.max(1, state.enemies.length);

  return (
    <>
      <color attach="background" args={[colors.sky]} />
      <fogExp2 attach="fog" args={[colors.fog, 0.036]} />
      <hemisphereLight args={['#d6e7ff', '#3a2c1c', 0.95]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[14, 22, 8]} intensity={1.45} />
      <Road level={level} />
      <City level={level} />
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[1, 16]} />
        <meshBasicMaterial color="#05070d" transparent opacity={0.35} />
      </mesh>
      <instancedMesh ref={body} args={[soldierGeo, undefined, MAX_SQUAD]} frustumCulled={false}>
        <LitMaterial color="#ffffff" roughness={0.62} metalness={0.08} />
      </instancedMesh>
      <instancedMesh ref={visor} args={[visorGeo, undefined, MAX_SQUAD]} frustumCulled={false}>
        <meshBasicMaterial color={colors.visor} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={enemies} args={[enemyGeo, undefined, enemyCount]} frustumCulled={false}>
        <LitMaterial color="#ffffff" roughness={0.55} />
      </instancedMesh>
      <instancedMesh ref={shots} args={[shotGeo, undefined, MAX_PROJECTILES]} frustumCulled={false}>
        <meshBasicMaterial color={colors.gold} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={bits} args={[bitGeo, undefined, MAX_PARTICLES]} frustumCulled={false}>
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <Gates state={state} />
      <Pickups state={state} />
      <Finale state={state} />
    </>
  );
}
