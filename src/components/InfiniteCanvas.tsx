"use client";

import { Canvas } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import { contentTree } from '../data/content';
import { calculateLayout } from '../utils/layoutEngine';
import { NodeCard } from './NodeCard';
import { ConnectionLine } from './ConnectionLine';

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { MapControls, Grid } from '@react-three/drei';
import { useSpring, useTransition, animated } from '@react-spring/three';
import { findNode, getDescendantIds, getPathToNode } from '../utils/treeUtils';

interface CameraControllerProps {
    layoutMap: Map<string, any>;
    activeId: string | null;
}

// Camera controller to handle initial positioning and smooth transitions
const CameraController = ({ layoutMap, activeId }: CameraControllerProps) => {
    const { camera, viewport, size } = useThree();
    const controlsRef = useRef<any>(null);
    // Track if we have performed the initial "Teleport" to the starting node
    const hasTeleportedRef = useRef(false);

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
        // We only move if we have a valid target (either Active ID or valid Root layout)
        // If activeId is null, we look for 'root' or whatever logic, BUT
        // the InfiniteCanvas logic sets activeId to 'root' default if layoutMap is built.
        // Let's assume layoutMap always has the target if it exists.

        const targetId = activeId || 'root'; // Fallback to root if null

        if (layoutMap.has(targetId)) {
            const node = layoutMap.get(targetId);
            const isMobile = size.width < 768;

            // Calculate Target Zoom:
            // Standard zoom based on node visibility
            const zoomHeight = size.height / (node.branchHeight * 1.5);
            const zoomWidth = size.width / (node.width * 1.5);
            let targetZoom = Math.min(zoomHeight, zoomWidth);
            targetZoom = Math.max(0.4, Math.min(2.5, targetZoom));

            let targetX = 0;
            const targetY = -node.y;

            if (isMobile) {
                // Mobile Logic
                const isArticle = node.type === 'article' || node.type === 'project';
                const hasChildren = node.children && node.children.length > 0;

                // Adjust zoom for mobile readability
                // CRITICAL FIX: Since we made nodes larger (95% of viewport), we must reduce padding
                // otherwise the camera zooms out to fit "1.5x" the node, making it look small again.
                // We use 1.05 divisor for tight fit (almost filling screen).
                if (isArticle) {
                    const zoomHeight = size.height / (node.branchHeight * 1.05);
                    const zoomWidth = size.width / (node.width * 1.05);
                    targetZoom = Math.min(zoomHeight, zoomWidth);
                    // Clamp zoom to reasonable levels for mobile
                    targetZoom = Math.max(0.6, Math.min(2.0, targetZoom));
                } else {
                    // Standard clamp for non-articles
                    targetZoom = Math.max(0.6, Math.min(3.0, targetZoom));
                }

                if (!isArticle && hasChildren) {
                    // CATEGORY / FOLDER Mode:
                    // Focus on Children. Shift Parent to Left Edge.
                    // TargetX is the center of the camera view.
                    // We want Parent's Right Edge (node.x + node.width) to be at Viewport Left + Padding.
                    // Viewport Width in World Units = size.width / targetZoom
                    const viewportWidthWorld = size.width / targetZoom;
                    // Position Camera such that:
                    // (node.x + node.width) = (CameraX - viewportWidthWorld/2) + Padding
                    // CameraX = (node.x + node.width) + viewportWidthWorld/2 - Padding

                    const padding = 20; // World units or pixels? This logic mixes units if not careful.
                    // The "size" from useThree is in screen pixels, but camera position is World Units.
                    // Orthographic camera: zoom 1 means 1 unit = 1 pixel (usually) if view is setup that way?
                    // Canvas (orthographic) -> zoom changes unit scale.
                    // Correct: Viewport covers "size.width / zoom" World Units.

                    const paddingWorld = 50; // Arbitrary gap
                    targetX = (node.x + node.width) + (viewportWidthWorld / 2) - paddingWorld;

                    // Actually, let's just center the FIRST CHILD column?
                    // Children start at: node.x + node.width + GAP
                    // targetX = node.x + node.width + 100 + (node.children[0].width/2) ?
                    // The "Shift Parent Left" is safer.
                } else {
                    // Article or Leaf Node: Center it.
                    targetX = node.x + (node.width / 2);
                }
            } else {
                // Desktop Logic
                const targetViewportWidth = size.width / targetZoom;
                targetX = node.x + (0.4 * targetViewportWidth);
            }

            if (!hasTeleportedRef.current) {
                // --- TELEPORT (Instant) ---
                //console.log(`[Camera] Teleporting to ${targetId} at (${targetX}, ${targetY})`);

                // Update Spring immediately so it doesn't fight back
                api.set({ targetX, targetY, targetZoom });

                // Update Camera & Controls immediately
                if (controlsRef.current) {
                    camera.position.x = targetX;
                    camera.position.y = targetY;
                    camera.zoom = targetZoom;
                    controlsRef.current.target.set(targetX, targetY, 0);
                    camera.updateProjectionMatrix();
                    controlsRef.current.update();
                }

                hasTeleportedRef.current = true;
            } else {
                // --- ANIMATE (Smooth) ---

                // CRITICAL FIX: Sync Spring to CURRENT camera reality first.
                // This prevents "jumping" to the last known Spring state if the user manually dragged.
                api.set({
                    targetX: camera.position.x,
                    targetY: camera.position.y,
                    targetZoom: camera.zoom
                });

                //console.log(`[Camera] Animating to ${targetId}`);
                api.start({
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

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export const InfiniteCanvas = ({ initialData }: InfiniteCanvasProps) => {
    // Use passed data, or fallback to hardcoded contentTree (for development/migration)
    // We use useState with an initializer to ignore prop updates. 
    // Once loaded, the Client Component owns the data state.
    const [rootData] = useState(() => initialData || contentTree);

    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set([]));
    const [activeId, setActiveId] = useState<string | null>(null);

    // Track Window Size for Layout Context
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        // Initial set
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Deep Linking: Hydrate state from URL (ONCE on mount)
    // We use a ref to ensure we grab the initial param value at mount time
    // without needing it in the dependency array (which would trigger updates).
    const initialParamRef = useRef(searchParams.get('node'));

    useEffect(() => {
        const nodeParam = initialParamRef.current; // Read from ref, stable.

        if (nodeParam) {
            const targetNode = findNode(rootData, nodeParam);
            if (targetNode) {
                const path = getPathToNode(rootData, nodeParam);
                if (path) {
                    const newExpanded = new Set(path);
                    setExpandedIds(newExpanded);
                    setActiveId(nodeParam);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // STRICTLY run once on mount. Ignore rootData updates to prevent re-hydration loops.

    const toggleNode = (id: string) => {
        const newSet = new Set(expandedIds);
        let nextActiveId = id;

        if (newSet.has(id)) {
            // Collapsing logic ...
            newSet.delete(id);
            const node = findNode(rootData, id);
            if (node) {
                const descendants = getDescendantIds(node);
                descendants.forEach(dId => newSet.delete(dId));

                // Resolve parent ID using path since Node doesn't hold parent reference
                const path = getPathToNode(rootData, id);
                if (path && path.length > 1) {
                    nextActiveId = path[path.length - 2];
                } else {
                    nextActiveId = node.id;
                }
            }
        } else {
            // Expanding logic ...
            newSet.add(id);
        }

        setExpandedIds(newSet);
        setActiveId(nextActiveId);

        // Sync URL
        const params = new URLSearchParams(searchParams);
        if (nextActiveId && nextActiveId !== 'root') {
            params.set('node', nextActiveId);
        } else {
            params.delete('node');
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // Recalculate layout whenever expansion state OR data changes
    const layoutMap = useMemo(() => {
        const isMobile = windowSize.width > 0 && windowSize.width < 768;
        return calculateLayout(rootData, expandedIds, {
            isMobile,
            viewportWidth: windowSize.width,
            viewportHeight: windowSize.height
        });
    }, [rootData, expandedIds, windowSize]); // Depend on rootData and windowSize


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
        <div className="w-full h-screen text-white overflow-hidden relative" style={{ backgroundColor: '#10355E' }}>
            <Canvas orthographic camera={{ zoom: 5, position: [0, 0, 100], near: -10000, far: 10000 }}>

                {/* Blueprint Grid */}
                <group position={[0, 0, -10]}>
                    <Grid
                        position={[0, 10, 0]}
                        rotation={[Math.PI / 2, 0, 0]}
                        args={[20000, 20000]}
                        cellSize={100}
                        cellThickness={0.6}
                        cellColor="#2B5C96" // Brighter / More noticeable
                        sectionSize={500}
                        sectionThickness={1.2}
                        sectionColor="#3A6EA5" // Darker / Less noticeable
                        fadeDistance={25000}
                    />
                </group>

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

            <div className="absolute bottom-4 left-4 pointer-events-none z-10">
                <h1 className="text-sm text-[#5C94D1]/70 font-[family-name:var(--font-cad)]">SYSTEM MAP v0.1</h1>
            </div>

            {/* Vignette Overlay */}
            <div
                className="absolute inset-0 pointer-events-none z-20"
                style={{
                    background: 'radial-gradient(circle at center, transparent 15%, rgba(5, 20, 40, 0.6) 60%, rgba(2, 10, 20, 0.95) 100%)',
                    boxShadow: 'inset 0 0 200px rgba(0,0,0,0.9)'
                }}
            />
        </div>
    );
};
