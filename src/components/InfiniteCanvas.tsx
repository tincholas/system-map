"use client";

import { Canvas } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import { contentTree } from '../data/content';
import { calculateLayout } from '../utils/layoutEngine';
import { NodeCard } from './NodeCard';
import { ConnectionLine } from './ConnectionLine';

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { MapControls } from '@react-three/drei';
import { useSpring, useTransition, animated } from '@react-spring/three';
import { findNode, getDescendantIds } from '../utils/treeUtils';

interface CameraControllerProps {
    layoutMap: Map<string, any>;
    activeId: string | null;
}

// Camera controller to handle initial positioning and smooth transitions
const CameraController = ({ layoutMap, activeId }: CameraControllerProps) => {
    const { camera, viewport, size } = useThree();
    const controlsRef = useRef<any>(null);
    const initializedRef = useRef(false);

    // Initial positioning: Left-align the root node (0,0) with 10% margin
    useEffect(() => {
        if (!initializedRef.current && controlsRef.current) {
            const targetX = 0.4 * (size.width / 5);

            // Set Camera Position & Target immediately
            camera.position.x = targetX;
            camera.position.y = 0;
            controlsRef.current.target.set(targetX, 0, 0);

            camera.updateProjectionMatrix();
            controlsRef.current.update();
            initializedRef.current = true;
        }
    }, [camera, size, controlsRef]);

    // Dynamic Panning: Animate to new Active Node
    const [spring, api] = useSpring(() => ({
        targetX: 0.4 * (size.width / 5),
        targetY: 0,
        targetZoom: 5,
        config: { mass: 1, tension: 100, friction: 26 }
    }));

    // Stop animation on manual interaction
    useEffect(() => {
        const controls = controlsRef.current;
        if (!controls) return;

        const onStart = () => {
            api.stop();
        };

        controls.addEventListener('start', onStart);
        return () => controls.removeEventListener('start', onStart);
    }, [api]);

    useEffect(() => {
        if (activeId && layoutMap.has(activeId)) {
            const node = layoutMap.get(activeId);

            // Calculate Target Zoom:
            // Goal: Fit the node's branch height vertically AND the node's width horizontally.
            // 1. Height fit:
            // size.height / zoom = node.branchHeight * 1.5 (padding)
            const zoomHeight = size.height / (node.branchHeight * 1.5);

            // 2. Width fit:
            // size.width / zoom = node.width * 1.5 (padding)
            const zoomWidth = size.width / (node.width * 1.5);

            // Take the smaller zoom to ensure BOTH fit
            // And CLAMP strictly to prevent "wild" variability
            let targetZoom = Math.min(zoomHeight, zoomWidth);
            targetZoom = Math.max(0.4, Math.min(2.5, targetZoom));

            // Re-calculate target camera X based on the NEW zoom level
            // targetViewportWidth = size.width / targetZoom
            const targetViewportWidth = size.width / targetZoom;

            // Now apply the 10% (0.4 factor from center) margin logic with the new width
            const targetX = node.x + (0.4 * targetViewportWidth);
            const targetY = -node.y; // Center node vertically

            api.start({
                from: {
                    targetX: camera.position.x,
                    targetY: camera.position.y,
                    targetZoom: camera.zoom
                },
                targetX,
                targetY,
                targetZoom,
                onChange: ({ value }) => {
                    if (controlsRef.current) {
                        camera.position.x = value.targetX;
                        camera.position.y = value.targetY;
                        camera.zoom = value.targetZoom;

                        controlsRef.current.target.set(value.targetX, value.targetY, 0);

                        camera.updateProjectionMatrix();
                        controlsRef.current.update();
                    }
                }
            });
        }
    }, [activeId, layoutMap, size, api, camera]);

    return (
        <MapControls
            ref={controlsRef}
            enableRotate={false}
            screenSpacePanning={true}
            minZoom={0.5}
            maxZoom={20}
            dampingFactor={0.1}
        />
    );
};

import { Node } from '../types/types';

interface InfiniteCanvasProps {
    initialData?: Node;
}

export const InfiniteCanvas = ({ initialData }: InfiniteCanvasProps) => {
    // Use passed data, or fallback to hardcoded contentTree (for development/migration)
    const rootData = useMemo(() => initialData || contentTree, [initialData]);

    // Initial state setup
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set([]));
    const [activeId, setActiveId] = useState<string | null>(null);

    const toggleNode = (id: string) => {
        const newSet = new Set(expandedIds);
        let nextActiveId = id;

        if (newSet.has(id)) {
            // Collapsing logic ...
            newSet.delete(id);
            const node = findNode(rootData, id); // Use rootData instead of contentTree
            if (node) {
                const descendants = getDescendantIds(node);
                descendants.forEach(dId => newSet.delete(dId));

                // Parent focus logic
                if (node.parentId) {
                    nextActiveId = node.parentId;
                } else {
                    // Collapsing root? Keep root active
                    nextActiveId = node.id;
                }
            }
        } else {
            // Expanding logic ...
            // Focus on the node we just clicked to center it
            newSet.add(id);
        }

        setExpandedIds(newSet);
        setActiveId(nextActiveId);
    };

    // Recalculate layout whenever expansion state OR data changes
    const layoutMap = useMemo(() => {
        return calculateLayout(rootData, expandedIds);
    }, [rootData, expandedIds]); // Depend on rootData


    const nodes = Array.from(layoutMap.values());

    const transitions = useTransition(nodes, {
        keys: item => item.id,
        from: { opacity: 0, scale: 0, rotateX: -Math.PI / 2 },
        enter: { opacity: 1, scale: 1, rotateX: 0 },
        leave: { opacity: 0, scale: 0, rotateX: -Math.PI / 2 },
        config: { mass: 1, tension: 170, friction: 26 },
        trail: 25
    });

    return (
        <div className="w-full h-screen bg-[#050505] text-white overflow-hidden">
            <Canvas orthographic camera={{ zoom: 5, position: [0, 0, 100], near: -10000, far: 10000 }}>
                <color attach="background" args={['#050505']} />

                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />

                {/* ZoomLogger removed */}

                <group>
                    {/* Render Lines first so they are behind nodes */}
                    {nodes.map((node, index) => {
                        if (!node.parentId) return null;
                        const parent = layoutMap.get(node.parentId);
                        if (!parent) return null;

                        return (
                            <ConnectionLine
                                key={`line-${node.id}`}
                                parent={parent}
                                child={node}
                                animationDelay={0}
                            />
                        );
                    })}

                    {/* Render Nodes with useTransition for entering/exiting animations */}
                    {transitions((style, node) => {
                        const animationDelay = node.level * 0.05;

                        return (
                            <NodeCard
                                key={node.id}
                                node={node}
                                isActive={activeId === node.id}
                                onClick={toggleNode}
                                animationDelay={animationDelay}
                                // @ts-ignore
                                transitionStyle={style}
                            />
                        );
                    })}
                </group>

                <CameraController layoutMap={layoutMap} activeId={activeId} />
            </Canvas>

            <div className="absolute bottom-4 left-4 pointer-events-none">
                <h1 className="text-sm font-mono text-cyan-500/50">SYSTEM MAP v0.1</h1>
            </div>
        </div>
    );
};
