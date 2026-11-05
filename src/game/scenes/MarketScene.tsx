import React, { useRef, useState } from 'react';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MarketStall, ProduceCluster, VendorCharacter } from './Stalls';
import { Player } from './Player';
import { Weather } from './Weather';
import { MarketLocationId, ProductId, WeatherType } from '../../types';

interface MarketSceneProps {
  locationId: MarketLocationId;
  weather: WeatherType;
  hour: number;
  onSelectProduct: (productId: ProductId) => void;
  onTalkNpc: (npcId: string) => void;
  onPlayerMove?: (x: number, z: number) => void;
  mobileDirection?: { x: number; z: number };
}

function ClickMarker({ position }: { position: [number, number, number] }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      const t = clock.getElapsedTime() * 5;
      const s = 1 + Math.sin(t) * 0.18;
      ringRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group position={position}>
      {/* Outer pulsing ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.32, 28]} />
        <meshBasicMaterial color="#d45a3f" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* Center dot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.07, 16]} />
        <meshBasicMaterial color="#fff4df" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function MarketScene({
  locationId,
  weather,
  hour,
  onSelectProduct,
  onTalkNpc,
  onPlayerMove,
  mobileDirection,
}: MarketSceneProps) {
  const isWholesale = locationId === 'wholesale_market';
  const [clickTarget, setClickTarget] = useState<{ x: number; z: number } | null>(null);

  const handleGroundClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // Clamp target within safe walkable bounds
    const x = THREE.MathUtils.clamp(e.point.x, -9.2, 9.2);
    const z = THREE.MathUtils.clamp(e.point.z, -9.2, 9.2);
    setClickTarget({ x, z });
  };

  return (
    <>
      <Weather weather={weather} hour={hour} />

      {/* Main Ground (Click to move anywhere on ground) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.06, 0]}
        receiveShadow
        onPointerDown={handleGroundClick}
      >
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color={isWholesale ? '#baa993' : '#bfa588'} roughness={0.95} />
      </mesh>

      {/* Main Walking Aisle */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.04, 0]}
        onPointerDown={handleGroundClick}
      >
        <planeGeometry args={[5.8, 25]} />
        <meshStandardMaterial color={isWholesale ? '#a89782' : '#ab8f70'} roughness={0.9} />
      </mesh>

      {/* Visual Marker for Click-to-Move Target */}
      {clickTarget && (
        <ClickMarker position={[clickTarget.x, 0.02, clickTarget.z]} />
      )}

      {/* Market Entrance Gate */}
      <group position={[0, 0, -9.5]}>
        {/* Gate Pillars */}
        <mesh position={[-3.2, 2.0, 0]} castShadow>
          <boxGeometry args={[0.55, 4.0, 0.55]} />
          <meshStandardMaterial color="#7a3424" roughness={0.7} />
        </mesh>
        <mesh position={[3.2, 2.0, 0]} castShadow>
          <boxGeometry args={[0.55, 4.0, 0.55]} />
          <meshStandardMaterial color="#7a3424" roughness={0.7} />
        </mesh>
        {/* Gate Beam */}
        <mesh position={[0, 3.8, 0]} castShadow>
          <boxGeometry args={[7.2, 0.65, 0.65]} />
          <meshStandardMaterial color="#5e261a" roughness={0.8} />
        </mesh>
        {/* Roof Tile curve */}
        <mesh position={[0, 4.25, 0]} castShadow>
          <boxGeometry args={[7.8, 0.3, 1.1]} />
          <meshStandardMaterial color="#9c4230" roughness={0.9} />
        </mesh>
      </group>

      {/* STALLS SETUP BASED ON LOCATION */}
      {!isWholesale ? (
        /* LOCAL RETAIL MARKET (CHỢ DÂN SINH) */
        <>
          {/* Left Stall 1: Sạp Rau Củ Bà Tư */}
          <MarketStall
            position={[-5.2, 0, -5.0]}
            title="SẠP BÀ TƯ"
            subTitle="Rau Củ Tươi Sáng Sớm"
            awningColor="#5c8a4d"
            counterColor="#a89279"
          />
          <ProduceCluster productId="tomato" position={[-5.8, 1.68, -4.3]} label="Cà chua" onSelect={onSelectProduct} />
          <ProduceCluster productId="greens" position={[-5.0, 1.68, -4.3]} label="Rau cải" onSelect={onSelectProduct} />
          <ProduceCluster productId="onion" position={[-4.2, 1.68, -4.3]} label="Hành tím" onSelect={onSelectProduct} />
          <VendorCharacter
            id="ba_tu"
            name="Bà Tư"
            roleTitle="Chủ Sạp Rau"
            position={[-5.2, 0, -3.1]}
            shirtColor="#567e49"
            onTalk={onTalkNpc}
          />

          {/* Right Stall 1: Vựa Cá Bà Sáu */}
          <MarketStall
            position={[5.2, 0, -5.0]}
            title="VỰA CÁ BÀ SÁU"
            subTitle="Cá Rô Đồng Tươi Rói"
            awningColor="#3d6c82"
            counterColor="#97a5a8"
          />
          <ProduceCluster productId="fish" position={[4.6, 1.68, -4.3]} label="Cá rô đồng" onSelect={onSelectProduct} />
          <ProduceCluster productId="fish" position={[5.4, 1.68, -4.3]} label="Cá tươi" onSelect={onSelectProduct} />
          <VendorCharacter
            id="ba_sau"
            name="Bà Sáu"
            roleTitle="Chủ Vựa Cá"
            position={[5.2, 0, -3.1]}
            shirtColor="#385b6e"
            onTalk={onTalkNpc}
          />

          {/* Left Stall 2: Quán Ăn & Trà Đá Chú Ba */}
          <MarketStall
            position={[-5.2, 0, 1.8]}
            title="QUÁN CHÚ BA"
            subTitle="Điểm Tâm & Trà Đá Vỉa Hè"
            awningColor="#c27d38"
            counterColor="#a67c52"
          />
          <ProduceCluster productId="egg" position={[-5.4, 1.68, 2.5]} label="Trứng gà" onSelect={onSelectProduct} />
          <ProduceCluster productId="rice" position={[-4.5, 1.68, 2.5]} label="Gạo thơm" onSelect={onSelectProduct} />
          <VendorCharacter
            id="chu_ba"
            name="Chú Ba"
            roleTitle="Chủ Quán Cơm"
            position={[-5.2, 0, 3.4]}
            shirtColor="#8c5832"
            hasHat={false}
            onTalk={onTalkNpc}
          />
        </>
      ) : (
        /* WHOLESALE MARKET (CHỢ ĐẦU MỐI) */
        <>
          {/* Wholesale Depot 1: Tổng Kho Nông Sản Bác Bảy */}
          <MarketStall
            position={[-5.2, 0, -5.0]}
            title="TỔNG KHO BÁC BẢY"
            subTitle="Bán Buôn Gạo & Nông Sản"
            awningColor="#8b5239"
            counterColor="#7a624d"
          />
          <ProduceCluster productId="rice" position={[-5.8, 1.68, -4.3]} label="Gạo ST25" onSelect={onSelectProduct} />
          <ProduceCluster productId="onion" position={[-5.0, 1.68, -4.3]} label="Hành củ tím" onSelect={onSelectProduct} />
          <ProduceCluster productId="tomato" position={[-4.2, 1.68, -4.3]} label="Cà chua sỉ" onSelect={onSelectProduct} />
          <VendorCharacter
            id="bac_bay"
            name="Bác Bảy"
            roleTitle="Đại Lý Bán Sỉ"
            position={[-5.2, 0, -3.1]}
            shirtColor="#684732"
            onTalk={onTalkNpc}
          />

          {/* Wholesale Depot 2: Đầu Mối Trứng & Gia Vị Chị Hoa */}
          <MarketStall
            position={[5.2, 0, -5.0]}
            title="VỰA TRỨNG CHỊ HOA"
            subTitle="Phân Phối Sỉ Toàn Vùng"
            awningColor="#c98a3c"
            counterColor="#8c826e"
          />
          <ProduceCluster productId="egg" position={[4.6, 1.68, -4.3]} label="Trứng gà sỉ" onSelect={onSelectProduct} />
          <ProduceCluster productId="greens" position={[5.4, 1.68, -4.3]} label="Rau cải sỉ" onSelect={onSelectProduct} />
          <VendorCharacter
            id="chi_hoa"
            name="Chị Hoa"
            roleTitle="Đầu Mối Trứng"
            position={[5.2, 0, -3.1]}
            shirtColor="#b36746"
            onTalk={onTalkNpc}
          />

          {/* Logistics Area: Xe Ba Gác Anh Hùng */}
          <MarketStall
            position={[5.2, 0, 1.8]}
            title="ĐỘI XE VẬN TẢI"
            subTitle="Giao Nhận Nhanh Chóng"
            awningColor="#495a69"
            counterColor="#69747d"
          />
          <VendorCharacter
            id="anh_hung"
            name="Anh Hùng"
            roleTitle="Tài Xế Ba Gác"
            position={[5.2, 0, 3.4]}
            shirtColor="#3b4b57"
            hasHat={false}
            onTalk={onTalkNpc}
          />
        </>
      )}

      {/* Decorative Traditional Trees */}
      {[
        [-8.5, -8.0],
        [8.5, -8.0],
        [-8.5, 7.5],
        [8.5, 7.5],
      ].map(([x, z], idx) => (
        <group key={idx} position={[x, 0, z]}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.22, 2.4, 8]} />
            <meshStandardMaterial color="#68553d" />
          </mesh>
          <mesh position={[0, 2.5, 0]}>
            <sphereGeometry args={[1.2, 8, 8]} />
            <meshStandardMaterial color="#4f803c" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Player Character */}
      <Player
        onMove={onPlayerMove}
        mobileDirection={mobileDirection}
        clickTarget={clickTarget}
        onClearTarget={() => setClickTarget(null)}
      />
    </>
  );
}
