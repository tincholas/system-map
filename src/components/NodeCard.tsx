"use client";

import { Html } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useSpring, animated } from '@react-spring/three';
import { LayoutNode } from '../types/types';

interface NodeCardProps {
  node: LayoutNode;
  isActive: boolean;
  onClick: (id: string) => void;
  animationDelay?: number;
}

// Two-phase animation: scaleX (horizontal line) → rotateX (flip toward camera)
const cardVariants = {
  initial: {
    scaleX: 0,
    rotateX: -90,
    opacity: 0,
  },
  animate: {
    scaleX: [0, 1, 1],
    rotateX: [-90, -90, 0],
    opacity: [0, 1, 1],
  },
};

export const NodeCard = ({ node, isActive, onClick, animationDelay = 0 }: NodeCardProps) => {
  const { x, y, width, height, title, type, status, description } = node;

  // Layout gives us x=LeftEdge, y=CenterY
  // Convert to CENTER X for rendering (drei Html center)
  const centerX = x + (width / 2);

  const { position } = useSpring({
    position: [centerX, -y, 0],
    config: { mass: 1, tension: 170, friction: 26 }
  });

  return (
    // @ts-ignore - position type conflict with spring
    <animated.group position={position}>
      {/* Debug Plane - remove in production */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="red" wireframe opacity={0.5} transparent />
      </mesh>

      <Html
        transform
        center
        scale={40}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          perspective: '1000px',
        }}
      >
        <motion.div
          className={`
            w-full h-full p-4 flex flex-col justify-between
            bg-neutral-900/80 backdrop-blur-md border border-cyan-500/30
            hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]
            transition-colors duration-300
            cursor-pointer select-none
            ${isActive ? 'ring-2 ring-cyan-500' : ''}
          `}
          style={{
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            transformOrigin: 'top center',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClick(node.id);
          }}
          variants={cardVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: 0.5,
            times: [0, 0.4, 1],
            ease: "easeOut",
            delay: animationDelay,
          }}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-cyan-500 uppercase tracking-widest">{type}</span>
            {status && (
              <span className={`text-[10px] px-1 py-0.5 border rounded ${status === 'production' ? 'border-green-500 text-green-500' :
                status === 'prototype' ? 'border-yellow-500 text-yellow-500' :
                  'border-neutral-500 text-neutral-500'
                }`}>
                {status}
              </span>
            )}
          </div>

          <div>
            <h3 className="text-white font-bold text-lg leading-tight mb-1">{title}</h3>
            {description && <p className="text-neutral-400 text-xs line-clamp-2">{description}</p>}
          </div>

          <div className="absolute -top-2 -right-2 w-2 h-2 bg-cyan-500 rounded-sm opacity-50" />
          <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-cyan-500 rounded-sm opacity-50" />
        </motion.div>
      </Html>
    </animated.group>
  );
};
