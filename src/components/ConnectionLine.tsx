"use client";

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { LayoutNode } from '../types/types';

interface ConnectionLineProps {
    parent: LayoutNode;
    child: LayoutNode;
}

export const ConnectionLine = ({ parent, child }: ConnectionLineProps) => {
    // Layout: x = LeftEdge, y = CenterY

    // Parent: Connect from RIGHT edge, at Center Y
    const startX = parent.x + parent.width; // Right Edge
    const startY = -parent.y;               // Center Y (negated for 3D)

    // Child: Connect to LEFT edge, at Center Y
    const endX = child.x;                   // Left Edge
    const endY = -child.y;                  // Center Y (negated for 3D)

    // Orthogonal midpoint
    const midX = (startX + endX) / 2;

    const points = useMemo(() => {
        return [
            [startX, startY, 0],
            [midX, startY, 0],
            [midX, endY, 0],
            [endX, endY, 0]
        ] as [number, number, number][];
    }, [startX, startY, endX, endY, midX]);

    return (
        <Line
            points={points}
            color="#22d3ee"
            lineWidth={3}
            transparent
            opacity={0.8}
            position={[0, 0, -0.1]}
        />
    );
};
