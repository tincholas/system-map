"use client";

import { Html } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useSpring as useSpringThree, animated as animatedThree, to } from '@react-spring/three';
import { useSpring as useSpringWeb, animated as animatedWeb } from '@react-spring/web';
import { useRef, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Carousel } from './Carousel';
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
  const isDraggingRef = useRef({ x: 0, y: 0 });
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

  // Special Rendering for Experiment Previews (Virtual Child Nodes)
  if (type === 'experiment-preview') {
    return (
      <animatedThree.group
        // @ts-ignore
        position={to([threeSpring.posX, threeSpring.posY], (px, py) => [px, py, 0])}
      >
        <Html
          frustumCulled={false}
          transform
          center
          scale={40}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: animationDelay }}
            className="w-[800px] h-[600px] bg-black border border-cyan-500 shadow-[0_0_30px_rgba(34,211,238,0.3)] overflow-hidden"
          >
            <div className="w-full h-8 bg-neutral-900 border-b border-cyan-500/30 flex items-center px-4">
              <span className="text-xs font-mono text-cyan-400 uppercase">{title} PREVIEW</span>
              {node.experimentUrl && (
                <a href={node.experimentUrl} target="_blank" rel="noreferrer" className="ml-auto text-[10px] text-neutral-500 hover:text-white">
                  OPEN IN NEW TAB ↗
                </a>
              )}
            </div>
            {node.experimentUrl && (
              <iframe
                src={node.experimentUrl}
                className="w-full h-full bg-white"
                title={`${title} Preview`}
              />
            )}
            {!node.experimentUrl && (
              <div className="w-full h-full flex items-center justify-center text-neutral-500">
                NO URL PROVIDED
              </div>
            )}
          </motion.div>
        </Html>
      </animatedThree.group>
    );
  }

  return (
    <animatedThree.group
      // @ts-ignore
      position={to([threeSpring.posX, threeSpring.posY], (px, py) => [px, py, 0])}
      frustumCulled={false}
    >
      {/* 
         Invisible Frame for Frustum Culling:
         Since the Group has no geometry, Three.js treats it as a point.
         This mesh gives it a bounding box matching the card size, ensuring it remains
         visible until the actual edges leave the screen.
      */}
      <animatedThree.group>
        <Html
          frustumCulled={false}
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
                onPointerDown={(e) => {
                  // Track start position to detect drags
                  isDraggingRef.current = { x: e.clientX, y: e.clientY };
                }}
                onClick={(e) => {
                  e.stopPropagation();

                  // Calculate distance moved
                  const dx = e.clientX - isDraggingRef.current.x;
                  const dy = e.clientY - isDraggingRef.current.y;
                  const distance = Math.hypot(dx, dy);

                  // Only trigger click if movement was minimal (not a drag)
                  if (distance < 10) {
                    onClick(node.id);
                  }
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
                          {node.gallery && node.gallery.length > 0 && (
                            <Carousel items={node.gallery} />
                          )}
                          <div className="prose prose-invert prose-sm max-w-none prose-p:text-neutral-300 prose-headings:text-cyan-400 prose-a:text-cyan-500 max-h-[450px] overflow-y-auto pr-2">
                            <ReactMarkdown>{content || "Detailed project content will appear here. Click to expand and see more information about this project."}</ReactMarkdown>
                          </div>
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
