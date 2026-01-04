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
import { useSpring, animated } from '@react-spring/three';
import { findNode, getDescendantIds } from '../utils/treeUtils';

interface CameraControllerProps {
    layoutMap: Map<string, any>;
    activeId: string | null;
}

// Camera controller to handle initial positioning and smooth transitions
const CameraController = ({ layoutMap, activeId }: CameraControllerProps) => {
    const { camera, viewport } = useThree();
    const controlsRef = useRef<any>(null);
    const initializedRef = useRef(false);

    // Initial positioning: Left-align the root node (0,0) with 10% margin
    useEffect(() => {
        if (!initializedRef.current && controlsRef.current) {
            const targetX = 0.4 * viewport.width;

            // Set Camera Position & Target immediately
            camera.position.x = targetX;
            camera.position.y = 0;
            controlsRef.current.target.set(targetX, 0, 0);

            camera.updateProjectionMatrix();
            controlsRef.current.update();
            initializedRef.current = true;
        }
    }, [camera, viewport, controlsRef]);

    // Dynamic Panning: Animate to new Active Node
    const [spring, api] = useSpring(() => ({
        targetX: 0.4 * viewport.width,
        targetY: 0,
        targetZoom: 5,
        config: { mass: 1, tension: 100, friction: 26 }
    }));

    useEffect(() => {
        if (activeId && layoutMap.has(activeId)) {
            const node = layoutMap.get(activeId);

            // Calculate Target Zoom:
            // Goal: Fit the node's branch height vertically AND the node's width horizontally.
            // 1. Height fit:
            // viewport.height / zoom = node.branchHeight * 1.5 (padding)
            const zoomHeight = viewport.height / (node.branchHeight * 1.5);

            // 2. Width fit:
            // viewport.width / zoom = node.width * 1.5 (padding)
            const zoomWidth = viewport.width / (node.width * 1.5);

            // Take the smaller zoom to ensure BOTH fit
            // And CLAMP strictly to prevent "wild" variability
            let targetZoom = Math.min(zoomHeight, zoomWidth);
            targetZoom = Math.max(0.4, Math.min(2.5, targetZoom));

            // Re-calculate target camera X based on the NEW zoom level
            // The viewport width will change when we zoom.
            // newViewportWidth = currentViewportWidth * (currentZoom / newZoom)
            const targetViewportWidth = viewport.width * (camera.zoom / targetZoom);

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
    }, [activeId, layoutMap, viewport, api, camera]);

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

/* removed ZoomLogger */
// ... imports cleanup ...

export const InfiniteCanvas = () => {
    // Initial state: Only root is visible (expandedIds empty implies only root exists as seed, children hidden)
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set([]));
    const [activeId, setActiveId] = useState<string | null>(null);

    const toggleNode = (id: string) => {
        const newSet = new Set(expandedIds);
        let nextActiveId = id;

        if (newSet.has(id)) {
            // Collapsing: Remove node and descendants
            newSet.delete(id);
            const node = findNode(contentTree, id);
            if (node) {
                const descendants = getDescendantIds(node);
                descendants.forEach(dId => newSet.delete(dId));

                // On collapse, focus on the Parent (or Root if no parent)
                // This zooms out to show the context where this node lives.
                nextActiveId = node.parentId || 'root';
            }
        } else {
            // Expanding: Add node
            newSet.add(id);
            // On expand, focus on the Node itself
            // This zooms in to show its new children.
            nextActiveId = id;
        }
        setExpandedIds(newSet);
        setActiveId(nextActiveId);
    };

    const layoutMap = useMemo(() => {
        // If expandedIds is empty, we must ensure Root is still in layout.
        // layoutEngine handles root passed as argument.
        // expandedIds controls CHILDREN visibility.
        return calculateLayout(contentTree, expandedIds);
    }, [expandedIds]);

    const nodes = Array.from(layoutMap.values());

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

                        // Line animates with a slight lead before the card appears
                        const baseDelay = node.level * 0.08;
                        const siblingDelay = (index % 10) * 0.05;
                        const lineDelay = Math.max(0, baseDelay + siblingDelay - 0.1);

                        return (
                            <ConnectionLine
                                key={`line-${node.id}`}
                                parent={parent}
                                child={node}
                                animationDelay={lineDelay}
                            />
                        );
                    })}

                    {/* Render Nodes with staggered animation delays */}
                    {nodes.map((node, index) => {
                        const baseDelay = node.level * 0.08;
                        const siblingDelay = (index % 10) * 0.05;
                        const animationDelay = baseDelay + siblingDelay;

                        return (
                            <NodeCard
                                key={node.id}
                                node={node}
                                isActive={activeId === node.id}
                                onClick={toggleNode}
                                animationDelay={animationDelay}
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
