import React, { useEffect, useRef } from 'react';

interface CircuitLine {
  x: number;
  y: number;
  length: number;
  speed: number;
  width: number;
  color: string;
  opacity: number;
  completed: boolean;
  nodePositions: number[];
  nodeGlowing: boolean[];
}

interface VerticalCircuitLinesProps {
  theme?: 'dark' | 'light';
}

export const VerticalCircuitLines: React.FC<VerticalCircuitLinesProps> = ({ theme = 'dark' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const circuitLinesRef = useRef<CircuitLine[]>([]);
  const lastTimeRef = useRef<number | null>(null);
  const lastLineCreationRef = useRef<number>(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas to full window size
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      circuitLinesRef.current = [];
      createInitialLines();
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    // Create initial set of lines
    function createInitialLines() {
      const lineCount = Math.max(10, Math.floor(window.innerWidth / 100));
      
      for (let i = 0; i < lineCount; i++) {
        createNewLine();
      }
    }
    
    // Create a new circuit line
    function createNewLine() {
      // Random horizontal position
      const x = Math.random() * canvas.width;
      
      // Start from bottom of screen
      const y = canvas.height + 20;
      
      // Random properties
      const length = Math.random() * 300 + 100;
      const speed = 0.5 + Math.random() * 1.5;
      const width = Math.random() * 1.5 + 0.5;
      
      // Color based on theme
      const color = theme === 'light' ? '#00E5FF' : '#00A9E0';
      
      // Create random node positions along the line
      const nodeCount = Math.floor(Math.random() * 4) + 1;
      const nodePositions = [];
      const nodeGlowing = [];
      
      for (let i = 0; i < nodeCount; i++) {
        // Position nodes along the line (0 = start, 1 = end)
        nodePositions.push(Math.random());
        // Some nodes start glowing
        nodeGlowing.push(Math.random() > 0.5);
      }
      
      circuitLinesRef.current.push({
        x,
        y,
        length,
        speed,
        width,
        color,
        opacity: 0.3 + Math.random() * 0.7,
        completed: false,
        nodePositions,
        nodeGlowing
      });
    }
    
    // Animation loop
    function animate(timestamp: number) {
      if (!ctx || !canvas) return;
      
      // Calculate delta time for smooth animations (handle first frame)
      const deltaTime = lastTimeRef.current ? timestamp - lastTimeRef.current : 16.67;
      lastTimeRef.current = timestamp;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create new lines periodically
      if (timestamp - lastLineCreationRef.current > 800) {
        if (Math.random() > 0.5) {
          createNewLine();
          lastLineCreationRef.current = timestamp;
        }
      }
      
      // Update and draw circuit lines
      updateAndDrawLines(deltaTime, timestamp);
      
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    // Update and draw circuit lines
    function updateAndDrawLines(deltaTime: number, timestamp: number) {
      if (!ctx) return;
      
      // Update and draw each circuit line
      for (let i = circuitLinesRef.current.length - 1; i >= 0; i--) {
        const line = circuitLinesRef.current[i];
        
        // Update position
        line.y -= line.speed;
        
        // Remove completed lines
        if (line.y + line.length < -50) {
          circuitLinesRef.current.splice(i, 1);
          continue;
        }
        
        // Draw the line
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(line.x, line.y + line.length);
        
        // Create gradient for line
        const gradient = ctx.createLinearGradient(line.x, line.y, line.x, line.y + line.length);
        gradient.addColorStop(0, `rgba(${theme === 'light' ? '0, 229, 255' : '0, 169, 224'}, ${line.opacity * 0.3})`);
        gradient.addColorStop(0.5, `rgba(${theme === 'light' ? '0, 229, 255' : '0, 169, 224'}, ${line.opacity})`);
        gradient.addColorStop(1, `rgba(${theme === 'light' ? '0, 229, 255' : '0, 169, 224'}, ${line.opacity * 0.3})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = line.width;
        ctx.lineCap = 'round';
        
        // Add glow effect
        ctx.shadowColor = line.color;
        ctx.shadowBlur = 5;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Draw nodes along the line
        line.nodePositions.forEach((pos, index) => {
          const nodeY = line.y + line.length * pos;

          // Only draw nodes that are within the canvas
          if (nodeY > 0 && nodeY < canvas.height) {
            // Update node glowing state
            if (Math.random() > 0.99) {
              line.nodeGlowing[index] = !line.nodeGlowing[index];
            }
            
            // Draw the node
            // Use a safe timestamp value
            const safeTimestamp = timestamp || 0;
            const nodeSize = line.nodeGlowing[index] ? 3 + Math.sin(safeTimestamp * 0.005) * 1 : 2;
            
            ctx.beginPath();
            ctx.arc(line.x, nodeY, nodeSize, 0, Math.PI * 2);
            
            // Node glow effect
            if (line.nodeGlowing[index]) {
              ctx.fillStyle = line.color;
              ctx.shadowColor = line.color;
              ctx.shadowBlur = 10;
            } else {
              ctx.fillStyle = `rgba(${theme === 'light' ? '0, 229, 255' : '0, 169, 224'}, ${line.opacity * 0.8})`;
              ctx.shadowBlur = 0;
            }
            
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });
        
        // Randomly add branches (horizontal lines)
        if (Math.random() > 0.997) {
          const branchY = line.y + Math.random() * line.length;
          
          // Only add branches that are within the canvas
          if (branchY > 0 && branchY < canvas.height) {
            // Determine branch direction (left or right)
            const direction = Math.random() > 0.5 ? 1 : -1;
            const branchLength = Math.random() * 50 + 20;
            
            ctx.beginPath();
            ctx.moveTo(line.x, branchY);
            ctx.lineTo(line.x + branchLength * direction, branchY);
            
            ctx.strokeStyle = `rgba(${theme === 'light' ? '0, 229, 255' : '0, 169, 224'}, ${line.opacity * 0.8})`;
            ctx.lineWidth = line.width * 0.8;
            
            // Add glow effect
            ctx.shadowColor = line.color;
            ctx.shadowBlur = 3;
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            // Add a node at the end of the branch
            ctx.beginPath();
            ctx.arc(line.x + branchLength * direction, branchY, 2, 0, Math.PI * 2);
            ctx.fillStyle = line.color;
            ctx.fill();
          }
        }
      }
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
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{
        opacity: 0.2
      }}
    />
  );
};

export default VerticalCircuitLines;