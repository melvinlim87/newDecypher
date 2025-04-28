import React, { useEffect, useRef } from 'react';

interface Cube {
  x: number;
  y: number;
  z: number;
  size: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  rotationSpeedX: number;
  rotationSpeedY: number;
  rotationSpeedZ: number;
  speedX: number;
  speedY: number;
  speedZ: number;
  color: string;
  opacity: number;
}

interface FloatingCubesProps {
  theme?: 'dark' | 'light';
}

export const FloatingCubes: React.FC<FloatingCubesProps> = ({ theme = 'dark' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const cubesRef = useRef<Cube[]>([]);
  const lastTimeRef = useRef<number | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas to full window size
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createCubes();
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    // Initialize cubes
    function createCubes() {
      const cubeCount = Math.floor((canvas.width * canvas.height) / 30000); // Increased density
      cubesRef.current = [];
      
      for (let i = 0; i < cubeCount; i++) {
        // Create cube with random properties
        cubesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random() * 500 - 250, // Random depth
          size: Math.random() * 30 + 15, // Larger size for better visibility
          rotationX: Math.random() * Math.PI * 2,
          rotationY: Math.random() * Math.PI * 2,
          rotationZ: Math.random() * Math.PI * 2,
          rotationSpeedX: (Math.random() - 0.5) * 0.01,
          rotationSpeedY: (Math.random() - 0.5) * 0.01,
          rotationSpeedZ: (Math.random() - 0.5) * 0.01,
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 0.5) * 0.2,
          speedZ: (Math.random() - 0.5) * 0.5,
          color: theme === 'light' ? '#00E5FF' : '#00A9E0',
          opacity: 0.3 + Math.random() * 0.5 // Increased opacity for better visibility
        });
      }
    }
    
    // Animation loop
    function animate(timestamp: number) {
      if (!ctx || !canvas) return;
      
      // Calculate delta time for smooth animations (handle first frame)
      const deltaTime = lastTimeRef.current ? timestamp - lastTimeRef.current : 16.67;
      lastTimeRef.current = timestamp; 
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw cubes
      updateAndDrawCubes(deltaTime);
      
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    // Update and draw cubes
    function updateAndDrawCubes(deltaTime: number) {
      if (!ctx || !canvas) return;
      
      // Sort cubes by z-index for proper depth rendering
      cubesRef.current.sort((a, b) => a.z - b.z);
      
      // Update and draw each cube
      cubesRef.current.forEach(cube => {
        // Update position
        cube.x += cube.speedX * deltaTime;
        cube.y += cube.speedY * deltaTime;
        cube.z += cube.speedZ * deltaTime;
        
        // Update rotation
        cube.rotationX += cube.rotationSpeedX * deltaTime;
        cube.rotationY += cube.rotationSpeedY * deltaTime;
        cube.rotationZ += cube.rotationSpeedZ * deltaTime;
        
        // Boundary check with wrapping
        if (cube.x < -cube.size) cube.x = canvas.width + cube.size;
        if (cube.x > canvas.width + cube.size) cube.x = -cube.size;
        if (cube.y < -cube.size) cube.y = canvas.height + cube.size;
        if (cube.y > canvas.height + cube.size) cube.y = -cube.size;
        
        // Z-axis wrapping
        if (cube.z < -250) cube.z = 250;
        if (cube.z > 250) cube.z = -250;
        
        // Calculate perspective scale based on z position
        const scale = 800 / (800 + cube.z);
        const size = cube.size * scale;
        
        // Calculate screen position with perspective
        const screenX = cube.x;
        const screenY = cube.y;
        
        // Draw cube
        drawCube(ctx, screenX, screenY, size, cube.rotationX, cube.rotationY, cube.rotationZ, cube.color, cube.opacity * scale);
      });
    }
    
    // Draw a 3D cube
    function drawCube(
      ctx: CanvasRenderingContext2D, 
      x: number, 
      y: number, 
      size: number, 
      rotationX: number, 
      rotationY: number, 
      rotationZ: number, 
      color: string, 
      opacity: number
    ) {
      // Define cube vertices (centered at origin)
      const vertices = [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
      ];
      
      // Define cube faces (indices of vertices)
      const faces = [
        [0, 1, 2, 3], // Front
        [4, 5, 6, 7], // Back
        [0, 1, 5, 4], // Bottom
        [2, 3, 7, 6], // Top
        [0, 3, 7, 4], // Left
        [1, 2, 6, 5]  // Right
      ];
      
      // Apply rotations and project vertices
      const projectedVertices = vertices.map(vertex => {
        let [x, y, z] = vertex;
        
        // Scale to size
        x *= size / 2;
        y *= size / 2;
        z *= size / 2;
        
        // Apply rotation around X axis
        const cosX = Math.cos(rotationX);
        const sinX = Math.sin(rotationX);
        const y1 = y * cosX - z * sinX;
        const z1 = y * sinX + z * cosX;
        
        // Apply rotation around Y axis
        const cosY = Math.cos(rotationY);
        const sinY = Math.sin(rotationY);
        const x2 = x * cosY + z1 * sinY;
        const z2 = -x * sinY + z1 * cosY;
        
        // Apply rotation around Z axis
        const cosZ = Math.cos(rotationZ);
        const sinZ = Math.sin(rotationZ);
        const x3 = x2 * cosZ - y1 * sinZ;
        const y3 = x2 * sinZ + y1 * cosZ;
        
        return [x3 + x, y3 + y, z2];
      });
      
      // Draw each face
      faces.forEach((face, index) => {
        const [a, b, c, d] = face;
        
        // Calculate face normal to determine visibility (backface culling)
        const [x1, y1] = [projectedVertices[b][0] - projectedVertices[a][0], projectedVertices[b][1] - projectedVertices[a][1]];
        const [x2, y2] = [projectedVertices[c][0] - projectedVertices[b][0], projectedVertices[c][1] - projectedVertices[b][1]];
        const normalZ = x1 * y2 - y1 * x2; // Z component of cross product
        
        // Only draw face if it's facing the viewer
        if (normalZ < 0) {
          ctx.beginPath();
          ctx.moveTo(projectedVertices[a][0], projectedVertices[a][1]);
          ctx.lineTo(projectedVertices[b][0], projectedVertices[b][1]);
          ctx.lineTo(projectedVertices[c][0], projectedVertices[c][1]);
          ctx.lineTo(projectedVertices[d][0], projectedVertices[d][1]);
          ctx.closePath();
          
          // Create gradient for face
          const gradient = ctx.createLinearGradient(
            projectedVertices[a][0], projectedVertices[a][1],
            projectedVertices[c][0], projectedVertices[c][1]
          );
          
          // Vary color based on face index for 3D effect
          const faceOpacity = opacity * (0.5 + (index % 3) * 0.15);
          gradient.addColorStop(0, `rgba(${theme === 'light' ? '0, 229, 255' : '0, 169, 224'}, ${faceOpacity})`);
          gradient.addColorStop(1, `rgba(${theme === 'light' ? '0, 229, 255' : '0, 169, 224'}, ${faceOpacity * 0.7})`);
          
          ctx.fillStyle = gradient;
          
          // Add glow effect
          ctx.shadowColor = color;
          ctx.shadowBlur = 5;
          ctx.fill();
          
          // Draw edges
          ctx.strokeStyle = `rgba(${theme === 'light' ? '0, 229, 255' : '0, 169, 224'}, ${opacity * 0.8})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
          
          // Reset shadow
          ctx.shadowBlur = 0;
        }
      });
    }
    
    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [theme]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30"
      style={{
        opacity: 0.3
      }} 
    />
  );
};

export default FloatingCubes;