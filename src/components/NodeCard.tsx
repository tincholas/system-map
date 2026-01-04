"use client";

import { Html } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useSpring as useSpringThree, animated as animatedThree, to } from '@react-spring/three';
import { useSpring as useSpringWeb, animated as animatedWeb } from '@react-spring/web';
import { useRef, useState, useEffect } from 'react';
import { LayoutNode } from '../types/types';

// Collapsed and expanded sizes for projects
const EXPANDED_WIDTH = 800;
const EXPANDED_HEIGHT = 600;

interface NodeCardProps {
  node: LayoutNode;
  isActive: boolean;
  onClick: (id: string) => void;
  animationDelay?: number;
}

// Two-phase animation: scaleX (horizontal line) → rotateX (flip toward camera)
const enterVariants = {
  initial: {
    scaleX: 0,
    rotateX: -90,
  },
  animate: {
    scaleX: [0, 1, 1],
    rotateX: [-90, -90, 0],
  },
};

export const NodeCard = ({ node, isActive, onClick, animationDelay = 0 }: NodeCardProps) => {
  const { x, y, width, height, title, type, status, description, isExpanded, content } = node;

  // Track if this node has completed its enter animation
  const isFirstRender = useRef(true);
  const [hasEnteredView, setHasEnteredView] = useState(false);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      const timer = setTimeout(() => {
        setHasEnteredView(true);
      }, (animationDelay + 0.6) * 1000);
      return () => clearTimeout(timer);
    }
  }, [animationDelay]);

  // Can this node expand in place?
  const canExpand = type === 'project' || type === 'experiment';

  // Spring for Three.js objects (position)
  const threeSpring = useSpringThree({
    posX: x + width / 2,
    posY: -y,
    config: { mass: 1, tension: 170, friction: 26 }
  });

  // Spring for DOM elements (dimensions)
  const webSpring = useSpringWeb({
    width: width,
    height: height,
    config: { mass: 1, tension: 170, friction: 26 }
  });

  return (
    <animatedThree.group
      // @ts-ignore
      position={to([threeSpring.posX, threeSpring.posY], (px, py) => [px, py, 0])}
    >
      <animatedThree.group>
        <Html
          transform
          center
          scale={40}
        >
          {/* Perspective container - perspective must be on parent */}
          <div style={{ perspective: '600px' }}>
            {/* Flip animation wrapper - this is what rotates */}
            <motion.div
              style={{
                transformStyle: 'preserve-3d',
                transformOrigin: 'top center',
              }}
              variants={enterVariants}
              initial={hasEnteredView ? false : "initial"}
              animate="animate"
              transition={{
                duration: 0.5,
                times: [0, 0.4, 1],
                ease: "easeOut",
                delay: hasEnteredView ? 0 : animationDelay,
              }}
            >
              {/* Outer container with border - animates size */}
              <animatedWeb.div
                className={`
                  bg-neutral-900/80 backdrop-blur-md border border-cyan-500/30
                  hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]
                  transition-colors duration-300
                  cursor-pointer select-none
                  ${isActive ? 'ring-2 ring-cyan-500' : ''}
                `}
                style={{
                  width: webSpring.width.to((w: number) => `${w}px`),
                  height: webSpring.height.to((h: number) => `${h}px`),
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(node.id);
                }}
              >
                {/* Clipping wrapper */}
                <div style={{
                  width: '100%',
                  height: '100%',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  {/* Inner content - full expanded size, clipped by parent */}
                  <div
                    style={{
                      width: canExpand ? `${EXPANDED_WIDTH}px` : '100%',
                      height: canExpand ? `${EXPANDED_HEIGHT}px` : '100%',
                    }}
                    className="p-4 flex flex-col"
                  >
                    <div className="flex justify-between items-start shrink-0">
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

                    <div className="flex-1 mt-2">
                      <h3 className="text-white font-bold text-lg leading-tight mb-1">{title}</h3>
                      {description && <p className="text-neutral-400 text-xs line-clamp-2">{description}</p>}

                      {/* Expanded content - only visible when container grows */}
                      {canExpand && (
                        <div className="mt-4 pt-4 border-t border-cyan-500/20">
                          <p className="text-neutral-300 text-sm">
                            {content || "Detailed project content will appear here. Click to expand and see more information about this project."}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="absolute -top-2 -right-2 w-2 h-2 bg-cyan-500 rounded-sm opacity-50" />
                    <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-cyan-500 rounded-sm opacity-50" />
                  </div>
                </div>
              </animatedWeb.div>
            </motion.div>
          </div>
        </Html>
      </animatedThree.group>
    </animatedThree.group>
  );
};
