"use client";

import { Canvas } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import { contentTree } from '../data/content';
import { calculateLayout } from '../utils/layoutEngine';
import { NodeCard } from './NodeCard';
import { ConnectionLine } from './ConnectionLine';

import { MapControls } from '@react-three/drei';

import { findNode, getDescendantIds } from '../utils/treeUtils';

export const InfiniteCanvas = () => {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['root']));
    const [activeId, setActiveId] = useState<string | null>(null);

    const toggleNode = (id: string) => {
        const newSet = new Set(expandedIds);

        if (newSet.has(id)) {
            newSet.delete(id);
            const node = findNode(contentTree, id);
            if (node) {
                const descendants = getDescendantIds(node);
                descendants.forEach(dId => newSet.delete(dId));
            }
        } else {
            newSet.add(id);
        }
        setExpandedIds(newSet);
        setActiveId(id);
    };

    const layoutMap = useMemo(() => {
        return calculateLayout(contentTree, expandedIds);
    }, [expandedIds]);

    const nodes = Array.from(layoutMap.values());

    return (
        <div className="w-full h-screen bg-[#050505] text-white overflow-hidden">
            <Canvas orthographic camera={{ zoom: 5, position: [0, 0, 100] }}>
                <color attach="background" args={['#050505']} />

                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />

                <group>
                    {/* Render Lines first so they are behind nodes */}
                    {nodes.map(node => {
                        if (!node.parentId) return null;
                        const parent = layoutMap.get(node.parentId);
                        if (!parent) return null;
                        return <ConnectionLine key={`line-${node.id}`} parent={parent} child={node} />;
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

                <MapControls
                    enableRotate={false}
                    screenSpacePanning={true}
                    minZoom={0.5}
                    maxZoom={20}
                    dampingFactor={0.1}
                />
            </Canvas>

            <div className="absolute bottom-4 left-4 pointer-events-none">
                <h1 className="text-sm font-mono text-cyan-500/50">SYSTEM MAP v0.1</h1>
            </div>
        </div>
    );
};
