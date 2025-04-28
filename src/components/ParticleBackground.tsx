import React, { useEffect, useRef } from 'react';

interface ParticleBackgroundProps {
  theme: string;
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  useEffect(() => {
  }, [theme]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{
        opacity: 0.3
      }}
    />
  );
};

export default ParticleBackground;