import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { MarketScene } from '../scenes/MarketScene';
import { MarketLocationId, ProductId, WeatherType } from '../../types';

interface CanvasViewportProps {
  locationId: MarketLocationId;
  weather: WeatherType;
  hour: number;
  onSelectProduct: (productId: ProductId) => void;
  onTalkNpc: (npcId: string) => void;
  onPlayerMove?: (x: number, z: number) => void;
  mobileDirection?: { x: number; z: number };
}

export function CanvasViewport(props: CanvasViewportProps) {
  return (
    <div className="canvas-container">
      <Canvas
        shadows
        camera={{ position: [0, 8.5, 13.5], fov: 42 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <MarketScene {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
