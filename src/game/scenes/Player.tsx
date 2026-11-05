import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PlayerProps {
  onMove?: (x: number, z: number) => void;
  mobileDirection?: { x: number; z: number };
  clickTarget?: { x: number; z: number } | null;
  onClearTarget?: () => void;
}

export function Player({ onMove, mobileDirection, clickTarget, onClearTarget }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const velocity = useRef(new THREE.Vector3());
  const direction = useMemo(() => new THREE.Vector3(), []);
  const cameraTarget = useMemo(() => new THREE.Vector3(), []);
  const moveTimer = useRef(0);
  const walkPhase = useRef(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Don't capture keys if typing in an input
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;
      keys.current[e.key.toLowerCase()] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const k = keys.current;

    const inputX =
      Number(!!(k.d || k.arrowright)) -
      Number(!!(k.a || k.arrowleft)) +
      (mobileDirection?.x ?? 0);
    const inputZ =
      Number(!!(k.s || k.arrowdown)) -
      Number(!!(k.w || k.arrowup)) +
      (mobileDirection?.z ?? 0);

    const hasManualInput = Math.hypot(inputX, inputZ) > 0.01;

    if (hasManualInput) {
      if (clickTarget) onClearTarget?.();
      direction.set(inputX, 0, inputZ);
    } else if (clickTarget) {
      const dx = clickTarget.x - groupRef.current.position.x;
      const dz = clickTarget.z - groupRef.current.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.22) {
        direction.set(dx / dist, 0, dz / dist);
      } else {
        direction.set(0, 0, 0);
        onClearTarget?.();
      }
    } else {
      direction.set(0, 0, 0);
    }

    const isMoving = direction.lengthSq() > 0.01;

    if (isMoving) {
      direction.normalize();
      velocity.current.lerp(direction.multiplyScalar(4.5), Math.min(1, delta * 12));
      groupRef.current.rotation.y = Math.atan2(velocity.current.x, velocity.current.z);
      walkPhase.current += delta * 10;
    } else {
      velocity.current.lerp(new THREE.Vector3(0, 0, 0), Math.min(1, delta * 14));
      walkPhase.current = 0;
    }

    // Move player with bounds
    groupRef.current.position.x = THREE.MathUtils.clamp(
      groupRef.current.position.x + velocity.current.x * delta,
      -9.5,
      9.5
    );
    groupRef.current.position.z = THREE.MathUtils.clamp(
      groupRef.current.position.z + velocity.current.z * delta,
      -9.5,
      9.5
    );

    // Subtle bobbing walk
    groupRef.current.position.y = isMoving ? Math.abs(Math.sin(walkPhase.current)) * 0.08 : 0;

    // Smooth camera follow
    cameraTarget.set(
      groupRef.current.position.x * 0.4,
      7.8,
      groupRef.current.position.z + 9.5
    );
    state.camera.position.lerp(cameraTarget, Math.min(1, delta * 3.5));
    state.camera.lookAt(groupRef.current.position.x, 0.9, groupRef.current.position.z - 0.5);

    moveTimer.current += delta;
    if (moveTimer.current >= 0.2) {
      moveTimer.current = 0;
      onMove?.(groupRef.current.position.x, groupRef.current.position.z);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 4]}>
      {/* Body: Áo bà ba màu gạch cam */}
      <mesh position={[0, 0.82, 0]} castShadow>
        <capsuleGeometry args={[0.28, 0.52, 6, 12]} />
        <meshStandardMaterial color="#d45a3f" roughness={0.7} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.48, 0]} castShadow>
        <sphereGeometry args={[0.24, 18, 14]} />
        <meshStandardMaterial color="#f2cbb0" roughness={0.6} />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 1.62, -0.04]}>
        <sphereGeometry args={[0.24, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
        <meshStandardMaterial color="#2d2420" />
      </mesh>

      {/* Conical Hat (Nón Lá) */}
      <mesh position={[0, 1.82, 0]} rotation={[0.08, 0, 0]} castShadow>
        <coneGeometry args={[0.55, 0.28, 22]} />
        <meshStandardMaterial color="#e8d5a8" roughness={0.8} />
      </mesh>

      {/* Woven market basket (Chiếc làn mây đi chợ) */}
      <group position={[0.36, 0.52, 0.08]} rotation={[0, 0, -0.15]}>
        <mesh castShadow>
          <boxGeometry args={[0.24, 0.32, 0.16]} />
          <meshStandardMaterial color="#b98248" roughness={0.9} />
        </mesh>
        {/* Handle */}
        <mesh position={[0, 0.2, 0]}>
          <torusGeometry args={[0.1, 0.02, 6, 12, Math.PI]} />
          <meshStandardMaterial color="#8a5b28" />
        </mesh>
      </group>
    </group>
  );
}
