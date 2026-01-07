"use client";

import { Html } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useSpring as useSpringThree, animated as animatedThree, to } from '@react-spring/three';
import { useSpring as useSpringWeb, animated as animatedWeb } from '@react-spring/web';
import { useRef, useState, useEffect } from 'react';
import { DocumentRenderer } from '@keystatic/core/renderer';
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
  transitionStyle?: any; // Received from useTransition
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



export const NodeCard = ({ node, isActive, onClick, animationDelay = 0, transitionStyle }: NodeCardProps) => {
  const { x, y, width, height, title, type, status, description, isExpanded, content } = node;
  if (title === 'About' && isExpanded) {
    console.log('NodeCard content for About:', content);
  }

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
  const canExpand = type === 'article' || type === 'project'; // Articles and projects expand

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


  // Special Rendering for Virtual Frames (Sidecar)
  if ((type === 'virtual-frame' || type === 'experiment') && node.iframeConfig) {
    return (
      <animatedThree.group
        // @ts-ignore
        // @ts-ignore
        // Add slight Z-offset (higher than standard nodes) to ensure previews are always on top
        position={to([threeSpring.posX, threeSpring.posY], (px, py) => [px, py, px * 0.001 + 5])}
        scale={transitionStyle?.scale || 1}
        // @ts-ignore
        rotation={transitionStyle?.rotateX ? transitionStyle.rotateX.to((val: number) => [val, 0, 0]) : [0, 0, 0]}
        frustumCulled={false}
      >
        <Html
          zIndexRange={[100, 0]}
          transform
          center
          scale={40}
          style={{
            // @ts-ignore
            opacity: transitionStyle.opacity
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: animationDelay }}
            className={`
              pointer-events-auto
              bg-black border border-neutral-800 rounded-lg overflow-hidden shadow-2xl
              flex flex-col relative
            `}
            style={{ width: `${width}px`, height: `${height}px` }}
          >
            <div className="w-full h-8 bg-neutral-900 border-b border-cyan-500/30 flex items-center px-4">
              <span className="text-xs font-mono text-cyan-400 uppercase">{title} PREVIEW</span>
              {node.iframeConfig.url && (
                <a href={node.iframeConfig.url} target="_blank" rel="noreferrer" className="ml-auto text-[10px] text-neutral-500 hover:text-white">
                  OPEN IN NEW TAB ↗
                </a>
              )}
            </div>
            {node.iframeConfig.url && (
              <iframe
                src={node.iframeConfig.url}
                className="w-full h-full bg-white"
                title={`${title} Preview`}
                allow="accelerometer; camera; encrypted-media; gyroscope; microphone; web-share"
                allowFullScreen
              />
            )}
            {!node.iframeConfig.url && (
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
      // @ts-ignore
      // Add slight Z-offset based on X to resolve z-fighting and ensure children (higher X) represent in front of parents
      position={to([threeSpring.posX, threeSpring.posY], (px, py) => [px, py, px * 0.001])}
      // @ts-ignore
      rotation={transitionStyle?.rotateX ? transitionStyle.rotateX.to((val: number) => [val, 0, 0]) : [0, 0, 0]}
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
          zIndexRange={[100, 0]} // Higher z-index for closer objects (Three.js standard behavior)
          transform
          center
          scale={40}
          style={{
            // Remove huge wrapper size, let it fit content
            // @ts-ignore
            opacity: transitionStyle?.opacity?.to((o: number) => o) ?? 1
          }}
        >
          {/* Perspective container */}
          <div style={{ perspective: '800px' }} className="pointer-events-none">
            <motion.div
              className="pointer-events-none"
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
              <animatedWeb.div
                className={`
                  pointer-events-auto
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
                      width: isExpanded ? `${node.width}px` : '100%',
                      height: isExpanded ? `${node.height}px` : '100%',
                    }}
                    className="p-4 flex flex-col"
                  >
                    <div className="flex justify-between items-start shrink-0">
                      <span className="text-xs md:text-xs font-mono text-cyan-500 uppercase tracking-widest">{node.label || type}</span>
                      {!!status && (
                        <span className={`text-[10px] px-1 py-0.5 border rounded ${status === 'production' ? 'border-green-500 text-green-500' :
                          status === 'prototype' ? 'border-yellow-500 text-yellow-500' :
                            'border-neutral-500 text-neutral-500'
                          }`}>
                          {status}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 mt-2">
                      {/* Mobile: text-2xl. Desktop: text-xl -> lg:text-2xl */}
                      <h3 className="text-white font-bold text-2xl md:text-xl lg:text-2xl leading-tight mb-1">{title}</h3>
                      {description && <p className="text-neutral-400 text-base md:text-xs line-clamp-2">{description}</p>}

                      {/* Expanded content - only visible when container grows */}
                      <div className="flex-1 mt-4 min-h-0 flex flex-col">
                        {canExpand && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isExpanded ? 1 : 0 }}
                            transition={{ duration: 0.3, delay: isExpanded ? 0.2 : 0 }}
                            className={`
                              flex-1 flex flex-col
                              ${!isExpanded ? 'pointer-events-none' : ''}
                            `}
                          >
                            <div className="pt-4 border-t border-cyan-500/20 flex-1 flex flex-col min-h-0">
                              {node.gallery && node.gallery.length > 0 && (
                                <Carousel items={node.gallery} />
                              )}
                              {/* Prose: Mobile = base (16px), Desktop = sm (14px) */}
                              <div className="prose prose-invert prose-base md:prose-sm max-w-none prose-p:text-neutral-300 prose-headings:text-cyan-400 prose-a:text-cyan-500 max-h-[450px] overflow-y-auto pr-2">
                                {content ? (
                                  <DocumentRenderer document={JSON.parse(content)} />
                                ) : (
                                  <p className="text-neutral-500 italic">Detailed project content will appear here. Click to expand and see more information about this project.</p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
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
