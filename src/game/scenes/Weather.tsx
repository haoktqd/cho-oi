import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WeatherType } from '../../types';

interface WeatherProps {
  weather: WeatherType;
  hour: number;
}

export function Weather({ weather, hour }: WeatherProps) {
  const rainRef = useRef<THREE.Points>(null);

  // Time of day lighting
  const isNight = hour >= 19 || hour <= 4;
  const isDawnOrDusk = (hour >= 5 && hour <= 6) || (hour >= 17 && hour <= 18);

  const sunColor = isNight
    ? '#4a5b78'
    : isDawnOrDusk
    ? '#ffaa5e'
    : weather === 'rainy'
    ? '#9faec2'
    : '#fff2db';

  const skyColor = isNight
    ? '#1a2238'
    : isDawnOrDusk
    ? '#d89b7d'
    : weather === 'rainy'
    ? '#8e9eab'
    : '#dce8e2';

  const sunIntensity = isNight ? 0.3 : weather === 'rainy' ? 1.0 : isDawnOrDusk ? 1.8 : 2.4;
  const ambientIntensity = isNight ? 0.4 : weather === 'rainy' ? 0.9 : 1.35;

  // Rain particles
  const rainCount = 600;
  const rainGeo = React.useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 26;
      positions[i * 3 + 1] = Math.random() * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 26;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (rainRef.current && weather === 'rainy') {
      const positions = rainRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < rainCount; i++) {
        positions[i * 3 + 1] -= delta * 16;
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 12;
        }
      }
      rainRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[skyColor, 16, 38]} />
      <ambientLight color={skyColor} intensity={ambientIntensity} />
      <directionalLight
        position={[8, 14, 6]}
        color={sunColor}
        intensity={sunIntensity}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />

      {weather === 'rainy' && (
        <points ref={rainRef} geometry={rainGeo}>
          <pointsMaterial color="#a7c3db" size={0.08} transparent opacity={0.65} />
        </points>
      )}
    </>
  );
}
