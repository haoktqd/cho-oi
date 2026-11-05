import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import { ProductId } from '../../types';
import { PRODUCTS } from '../../economy/catalog';

interface ProduceProps {
  productId: ProductId;
  position: [number, number, number];
  label: string;
  onSelect: (productId: ProductId) => void;
}

export function ProduceCluster({ productId, position, label, onSelect }: ProduceProps) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<THREE.Group>(null);
  const pDef = PRODUCTS[productId];

  useFrame((state) => {
    if (ref.current && hovered) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 4) * 0.04;
    }
  });

  return (
    <group
      ref={ref}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(productId);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
      scale={hovered ? 1.15 : 1}
    >
      {/* Produce basket / crate */}
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[0.38, 0.32, 0.16, 16]} />
        <meshStandardMaterial color="#c49a68" roughness={0.9} />
      </mesh>

      {/* Produce items inside */}
      {productId === 'fish' ? (
        <group position={[0, 0.05, 0]}>
          {/* Water bucket */}
          <mesh>
            <cylinderGeometry args={[0.36, 0.36, 0.14, 16]} />
            <meshStandardMaterial color="#4287f5" transparent opacity={0.65} roughness={0.1} />
          </mesh>
          {/* Fish */}
          <mesh rotation={[0, 0.4, 0]}>
            <capsuleGeometry args={[0.07, 0.28, 4, 8]} />
            <meshStandardMaterial color="#7ea5b8" roughness={0.4} metalness={0.2} />
          </mesh>
        </group>
      ) : productId === 'rice' ? (
        /* Rice sack */
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.42, 0.32, 0.32]} />
          <meshStandardMaterial color="#e5ddc5" roughness={0.9} />
        </mesh>
      ) : (
        /* Produce Spheres / vegetables */
        <group position={[0, 0.08, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.18, 14, 12]} />
            <meshStandardMaterial color={pDef.color} roughness={0.5} />
          </mesh>
          <mesh position={[0.12, 0.04, -0.08]}>
            <sphereGeometry args={[0.15, 12, 10]} />
            <meshStandardMaterial color={pDef.color} roughness={0.5} />
          </mesh>
          <mesh position={[-0.1, 0.02, 0.09]}>
            <sphereGeometry args={[0.16, 12, 10]} />
            <meshStandardMaterial color={pDef.color} roughness={0.5} />
          </mesh>
        </group>
      )}

      {hovered && (
        <Html position={[0, 0.55, 0]} center distanceFactor={9}>
          <div className="stall-3d-tooltip">
            <span>{pDef.emoji}</span> Xem giá {label}
          </div>
        </Html>
      )}
    </group>
  );
}

interface StallProps {
  position: [number, number, number];
  title: string;
  subTitle: string;
  awningColor: string;
  counterColor: string;
  roofRotation?: number;
}

export function MarketStall({
  position,
  title,
  subTitle,
  awningColor,
  counterColor,
  roofRotation = -0.06,
}: StallProps) {
  return (
    <group position={position}>
      {/* Base Counter */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 1.5, 1.8]} />
        <meshStandardMaterial color={counterColor} roughness={0.85} />
      </mesh>

      {/* Counter Top Board */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <boxGeometry args={[3.8, 0.14, 2.0]} />
        <meshStandardMaterial color="#8e5d36" roughness={0.7} />
      </mesh>

      {/* Awning Fabric Roof */}
      <mesh position={[0, 2.5, 0.2]} rotation={[roofRotation, 0, 0]} castShadow>
        <boxGeometry args={[4.1, 0.45, 2.4]} />
        <meshStandardMaterial color={awningColor} roughness={0.9} />
      </mesh>

      {/* Bamboo Support Poles */}
      {[-1.6, 1.6].map((x) => (
        <React.Fragment key={x}>
          <mesh position={[x, 1.5, 0.9]} castShadow>
            <cylinderGeometry args={[0.045, 0.045, 2.1, 8]} />
            <meshStandardMaterial color="#a07548" roughness={0.9} />
          </mesh>
          <mesh position={[x, 1.5, -0.9]} castShadow>
            <cylinderGeometry args={[0.045, 0.045, 2.1, 8]} />
            <meshStandardMaterial color="#a07548" roughness={0.9} />
          </mesh>
        </React.Fragment>
      ))}

      {/* Stall Sign Banner */}
      <group position={[0, 2.95, 1.05]}>
        <mesh castShadow>
          <boxGeometry args={[2.8, 0.45, 0.08]} />
          <meshStandardMaterial color="#2d221c" roughness={0.8} />
        </mesh>
        <Text
          position={[0, 0.08, 0.06]}
          fontSize={0.2}
          color="#ffeed1"
          anchorX="center"
          outlineWidth={0.015}
          outlineColor="#1a120e"
        >
          {title}
        </Text>
        <Text
          position={[0, -0.1, 0.06]}
          fontSize={0.11}
          color="#ffd68a"
          anchorX="center"
        >
          {subTitle}
        </Text>
      </group>

      {/* Hanging Lantern */}
      <group position={[1.5, 2.2, 0.9]}>
        <mesh castShadow>
          <sphereGeometry args={[0.14, 12, 10]} />
          <meshStandardMaterial color="#df382b" emissive="#df382b" emissiveIntensity={0.3} />
        </mesh>
      </group>
    </group>
  );
}

interface VendorProps {
  id: string;
  name: string;
  roleTitle: string;
  position: [number, number, number];
  shirtColor: string;
  hasHat?: boolean;
  onTalk: (npcId: string) => void;
}

export function VendorCharacter({
  id,
  name,
  roleTitle,
  position,
  shirtColor,
  hasHat = true,
  onTalk,
}: VendorProps) {
  const [hovered, setHovered] = useState(false);
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.09;
    }
  });

  return (
    <group
      ref={group}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onTalk(id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Body */}
      <mesh position={[0, 0.78, 0]} castShadow>
        <capsuleGeometry args={[0.27, 0.54, 5, 10]} />
        <meshStandardMaterial color={shirtColor} roughness={0.7} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.44, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 12]} />
        <meshStandardMaterial color="#f0caa8" />
      </mesh>

      {/* Nón lá */}
      {hasHat && (
        <mesh position={[0, 1.76, 0]} rotation={[0.06, 0, 0]} castShadow>
          <coneGeometry args={[0.52, 0.26, 20]} />
          <meshStandardMaterial color="#e5d09f" roughness={0.8} />
        </mesh>
      )}

      {hovered && (
        <Html position={[0, 2.15, 0]} center distanceFactor={8}>
          <div className="npc-3d-bubble">
            <strong>{name}</strong>
            <small>{roleTitle} · Trò chuyện</small>
          </div>
        </Html>
      )}

      <Text
        position={[0, 2.05, 0]}
        fontSize={0.17}
        color="#3d2a1c"
        anchorX="center"
        outlineWidth={0.02}
        outlineColor="#fff"
      >
        {name}
      </Text>
    </group>
  );
}
