import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/* Valley geometry helpers                                             */
/* ------------------------------------------------------------------ */

const Z_START = -90; // upstream, Tibetan side
const Z_END = 90; // downstream, Trishuli

/** Height of the valley floor at a given z (river runs +Z downstream). */
function floorAt(z: number) {
  const t = (z - Z_START) / (Z_END - Z_START);
  return 8 - t * 17 - Math.sin(t * 9) * 0.6;
}

/** Lateral offset of the channel (meanders). */
function channelAt(z: number) {
  return Math.sin(z * 0.035) * 5 + Math.sin(z * 0.011) * 3;
}

/** Terrain surface height. */
function terrainAt(x: number, z: number) {
  const d = Math.abs(x - channelAt(z));
  const wall = Math.pow(Math.min(d / 26, 1), 1.7) * 34;
  const ridge =
    Math.sin(x * 0.21 + z * 0.09) * 1.3 +
    Math.sin(z * 0.33) * 0.9 +
    Math.cos(x * 0.09 - z * 0.17) * 1.8;
  const gorge = d < 3 ? -1.2 + d * 0.3 : 0;
  return floorAt(z) + wall + ridge * Math.min(d / 8, 1) + gorge;
}

function useTerrainGeometry() {
  return useMemo(() => {
    const wSeg = 120;
    const hSeg = 220;
    const geo = new THREE.PlaneGeometry(80, Z_END - Z_START, wSeg, hSeg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes['position'] as THREE.BufferAttribute;
    const colors: number[] = [];
    const rock = new THREE.Color("#3a4250");
    const snow = new THREE.Color("#d8e6ef");
    const silt = new THREE.Color("#5b5344");
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i) + (Z_START + Z_END) / 2;
      const y = terrainAt(x, z);
      pos.setY(i, y);
      pos.setZ(i, z);
      const rel = y - floorAt(z);
      const c = rock.clone();
      if (rel < 2.5) c.lerp(silt, 0.75);
      if (rel > 18) c.lerp(snow, Math.min((rel - 18) / 14, 1));
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);
}

/* ------------------------------------------------------------------ */
/* Water: calm river + flood surge                                     */
/* ------------------------------------------------------------------ */

function useRibbonGeometry(width: number, segments = 240) {
  return useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, Z_END - Z_START, 12, segments);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [width, segments]);
}

function River({ progress }: { progress: MutableRefObject<number> }) {
  const geo = useRibbonGeometry(3.4);
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    const pos = mesh.geometry.attributes['position'] as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i) + (Z_START + Z_END) / 2;
      pos.setX(i, pos.getX(i) - (pos.getX(i) - channelAt(z)) * 0);
      pos.setY(i, floorAt(z) + 0.35 + Math.sin(z * 0.6 + t * 2.2) * 0.12);
    }
    pos.needsUpdate = true;
    mesh.position.z = (Z_START + Z_END) / 2;
    // river dries out below the blockage while the dam holds
    const p = progress.current;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.opacity = p > 0.28 && p < 0.5 ? 0.35 : 0.8;
  });

  return (
    <mesh ref={ref} geometry={geo} position={[0, 0, 0]}>
      <meshStandardMaterial
        color="#3f7f96"
        transparent
        opacity={0.8}
        roughness={0.15}
        metalness={0.1}
      />
    </mesh>
  );
}

const DAM_Z = -46;

/** Debris / ice dam that forms then breaches. */
function DebrisDam({ progress }: { progress: MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const blocks = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        x: channelAt(DAM_Z) + (Math.random() - 0.5) * 9,
        y: Math.random() * 3.4,
        z: DAM_Z + (Math.random() - 0.5) * 7,
        s: 0.8 + Math.random() * 2.2,
        r: Math.random() * Math.PI,
        drop: 26 + Math.random() * 12,
        ice: Math.random() > 0.45,
      })),
    [],
  );

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const p = progress.current;
    // 0.14–0.28 : avalanche falls in.  0.42–0.58 : dam is torn out.
    const fall = THREE.MathUtils.clamp((p - 0.14) / 0.14, 0, 1);
    const burst = THREE.MathUtils.clamp((p - 0.44) / 0.12, 0, 1);
    g.children.forEach((child, i) => {
      const b = blocks[i]!;
      child.position.y = floorAt(DAM_Z) + b.y + (1 - fall) * b.drop;
      child.position.z = b.z + burst * (14 + i);
      child.rotation.x = b.r + fall * 3 + burst * 6;
      child.rotation.z = b.r * 1.4 + burst * 4;
      const s = b.s * (1 - burst * 0.85);
      child.scale.setScalar(Math.max(s, 0.001));
      (child as THREE.Mesh).visible = fall > 0.001;
    });
  });

  return (
    <group ref={group}>
      {blocks.map((b, i) => (
        <mesh key={i} position={[b.x, 0, b.z]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={b.ice ? "#cfe7f2" : "#4a4a4f"}
            roughness={b.ice ? 0.25 : 0.9}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

/** Water impounded behind the dam, then the surge front travelling downstream. */
function Flood({ progress }: { progress: MutableRefObject<number> }) {
  const geo = useRibbonGeometry(30, 260);
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const p = progress.current;
    const t = clock.elapsedTime;

    const pond = THREE.MathUtils.clamp((p - 0.2) / 0.24, 0, 1); // lake builds
    const release = THREE.MathUtils.clamp((p - 0.44) / 0.34, 0, 1); // front runs
    const frontZ = DAM_Z + release * (Z_END - DAM_Z + 20);
    const drain = THREE.MathUtils.clamp((p - 0.62) / 0.3, 0, 1);

    const pos = mesh.geometry.attributes['position'] as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i) + (Z_START + Z_END) / 2;
      const base = floorAt(z);
      let h = -400;
      if (z <= DAM_Z) {
        // impounded lake upstream of the blockage
        const lake = floorAt(DAM_Z) + pond * 7 * (1 - release * 0.9);
        if (lake > base) h = lake;
      } else if (z < frontZ) {
        const nose = THREE.MathUtils.clamp((frontZ - z) / 12, 0, 1);
        const depth = (2.5 + 7 * nose) * (1 - drain * 0.72);
        h = base + depth + Math.sin(z * 0.9 - t * 7) * 0.5 * nose;
      }
      pos.setY(i, h);
    }
    pos.needsUpdate = true;
    mesh.position.z = (Z_START + Z_END) / 2;
  });

  return (
    <mesh ref={ref} geometry={geo}>
      <meshStandardMaterial
        color="#7d6a4f"
        emissive="#2a1e12"
        roughness={0.35}
        metalness={0.05}
        transparent
        opacity={0.94}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Settlements swept away                                              */
/* ------------------------------------------------------------------ */

type Site = { name: string; z: number; count: number };
const SITES: Site[] = [
  { name: "Rasuwagadhi / Timure", z: 6, count: 16 },
  { name: "Syabrubesi", z: 44, count: 14 },
  { name: "Trishuli · Nuwakot", z: 82, count: 10 },
];

function Settlement({
  site,
  progress,
}: {
  site: Site;
  progress: MutableRefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const items = useMemo(
    () =>
      Array.from({ length: site.count }, (_, i) => {
        const side = i % 2 === 0 ? 1 : -1;
        const z = site.z + (i - site.count / 2) * 1.6;
        return {
          x: channelAt(z) + side * (2.6 + Math.random() * 4),
          z,
          w: 0.7 + Math.random() * 0.9,
          h: 0.8 + Math.random() * 1.5,
          tilt: (Math.random() - 0.5) * 2,
        };
      }),
    [site],
  );

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const p = progress.current;
    const release = THREE.MathUtils.clamp((p - 0.44) / 0.34, 0, 1);
    const frontZ = DAM_Z + release * (Z_END - DAM_Z + 20);
    g.children.forEach((child, i) => {
      const it = items[i]!;
      const hit = THREE.MathUtils.clamp((frontZ - it.z) / 10, 0, 1);
      child.rotation.z = it.tilt * hit;
      child.position.y = floorAt(it.z) + it.h / 2 - hit * it.h * 1.1;
      child.position.z = it.z + hit * 6 * Math.abs(it.tilt);
    });
  });

  return (
    <group ref={group}>
      {items.map((it, i) => (
        <mesh key={i} position={[it.x, 0, it.z]}>
          <boxGeometry args={[it.w, it.h, it.w]} />
          <meshStandardMaterial color="#c9bfae" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function SiteLabel({ site }: { site: Site }) {
  return (
    <Billboard position={[channelAt(site.z) + 9, floorAt(site.z) + 7, site.z]}>
      <Text fontSize={1.5} color="#f3c14b" anchorX="left" outlineWidth={0.03} outlineColor="#0b1017">
        {site.name}
      </Text>
    </Billboard>
  );
}

/* ------------------------------------------------------------------ */
/* Glacier at the head of the Lhende                                   */
/* ------------------------------------------------------------------ */

function Glacier() {
  const slabs = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const z = Z_START + 4 + i * 1.6;
        return {
          x: channelAt(z) + (Math.random() - 0.5) * 8,
          z,
          y: floorAt(z) + 6 + Math.random() * 6,
          s: 2 + Math.random() * 3.5,
        };
      }),
    [],
  );
  return (
    <group>
      {slabs.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, s.z]} rotation={[0.2, i, 0.1]}>
          <boxGeometry args={[s.s, s.s * 0.5, s.s]} />
          <meshStandardMaterial color="#e6f3fa" roughness={0.2} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Camera flight                                                       */
/* ------------------------------------------------------------------ */

/** Camera keyframes expressed in valley coordinates so the lens always
 *  stays inside the gorge, above the floor and below the ridge line. */
const WAYPOINTS: { z: number; side: number; up: number; ahead: number }[] = [
  { z: -80, side: 7, up: 14, ahead: 26 }, // glaciated headwaters
  { z: -64, side: -8, up: 12, ahead: 22 }, // avalanche falls in
  { z: -56, side: 9, up: 8, ahead: 14 }, // the blockage
  { z: -50, side: -6, up: 5, ahead: 12 }, // breach, at water level
  { z: -8, side: 8, up: 9, ahead: 22 }, // Rasuwagadhi / Timure
  { z: 34, side: -9, up: 11, ahead: 26 }, // Syabrubesi
  { z: 70, side: 10, up: 18, ahead: 30 }, // into the Trishuli
];

function camPoint(w: { z: number; side: number; up: number; ahead: number }) {
  return {
    pos: new THREE.Vector3(channelAt(w.z) + w.side, floorAt(w.z) + w.up, w.z),
    look: new THREE.Vector3(
      channelAt(w.z + w.ahead),
      floorAt(w.z + w.ahead) + 1.5,
      w.z + w.ahead,
    ),
  };
}

function CameraRig({ progress }: { progress: MutableRefObject<number> }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const p = THREE.MathUtils.clamp(progress.current, 0, 1);
    const f = p * (WAYPOINTS.length - 1);
    const i = Math.min(Math.floor(f), WAYPOINTS.length - 2);
    const k = THREE.MathUtils.smoothstep(f - i, 0, 1);
    const a = camPoint(WAYPOINTS[i]!);
    const b = camPoint(WAYPOINTS[i + 1]!);
    const px = THREE.MathUtils.lerp(a.pos.x, b.pos.x, k);
    const py = THREE.MathUtils.lerp(a.pos.y, b.pos.y, k);
    const pz = THREE.MathUtils.lerp(a.pos.z, b.pos.z, k);

    const damp = 1 - Math.pow(0.001, delta);
    camera.position.lerp(new THREE.Vector3(px, py, pz), damp);
    target.current.lerp(
      new THREE.Vector3(
        THREE.MathUtils.lerp(a.look.x, b.look.x, k),
        THREE.MathUtils.lerp(a.look.y, b.look.y, k),
        THREE.MathUtils.lerp(a.look.z, b.look.z, k),
      ),
      damp,
    );

    camera.lookAt(target.current);
  });

  return null;
}

/* ------------------------------------------------------------------ */

function Valley({ progress }: { progress: MutableRefObject<number> }) {
  const geo = useTerrainGeometry();
  return (
    <group>
      <mesh geometry={geo} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.95} flatShading />
      </mesh>
      <Glacier />
      <River progress={progress} />
      <DebrisDam progress={progress} />
      <Flood progress={progress} />
      {SITES.map((s) => (
        <group key={s.name}>
          <Settlement site={s} progress={progress} />
          <SiteLabel site={s} />
        </group>
      ))}
      <Billboard position={[channelAt(DAM_Z) + 8, floorAt(DAM_Z) + 9, DAM_Z]}>
        <Text fontSize={1.4} color="#8fdcf0" anchorX="left" outlineWidth={0.03} outlineColor="#0b1017">
          Lhende Khola blockage
        </Text>
      </Billboard>
    </group>
  );
}

export default function Scene({ progress }: { progress: MutableRefObject<number> }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [22, 26, -84], fov: 52, near: 0.1, far: 600 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#0b1017"]} />
      <fog attach="fog" args={["#0b1017", 70, 240]} />
      <hemisphereLight args={["#9fc4dd", "#1d2129", 0.9]} />
      <directionalLight position={[40, 60, -20]} intensity={1.5} color="#fdf3e0" />
      <directionalLight position={[-30, 20, 40]} intensity={0.35} color="#6ea9c9" />
      <CameraRig progress={progress} />
      <Valley progress={progress} />
    </Canvas>
  );
}
