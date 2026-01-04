"use client";

import { useMemo, useRef, useState, useEffect } from 'react';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { LayoutNode } from '../types/types';

interface ConnectionLineProps {
    parent: LayoutNode;
    child: LayoutNode;
    animationDelay?: number;
}

export const ConnectionLine = ({ parent, child, animationDelay = 0 }: ConnectionLineProps) => {
    // Layout: x = LeftEdge, y = CenterY

    // Parent: Connect from RIGHT edge, at Center Y
    const startX = parent.x + parent.width;
    const startY = -parent.y;

    // Child: Connect to LEFT edge, at Center Y
    const endX = child.x;
    const endY = -child.y;

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

    // Calculate total line length for dash animation
    const totalLength = useMemo(() => {
        const h1 = Math.abs(midX - startX);
        const v = Math.abs(endY - startY);
        const h2 = Math.abs(endX - midX);
        return h1 + v + h2;
    }, [startX, midX, endX, startY, endY]);

    // Animation state
    const [progress, setProgress] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const animationDuration = 0.4; // seconds

    useFrame((state) => {
        if (startTimeRef.current === null) {
            startTimeRef.current = state.clock.elapsedTime + animationDelay;
        }

        const elapsed = state.clock.elapsedTime - startTimeRef.current;

        if (elapsed >= 0 && progress < 1) {
            const newProgress = Math.min(elapsed / animationDuration, 1);
            setProgress(newProgress);
        }
    });

    // Dash settings: dashArray creates the pattern, dashOffset reveals it
    // As dashOffset goes from totalLength to 0, the line "draws in"
    const dashOffset = totalLength * (1 - progress);

    return (
        <Line
            points={points}
            color="#22d3ee"
            lineWidth={3}
            transparent
            opacity={0.8 * progress} // Also fade in
            position={[0, 0, -0.1]}
            dashed
            dashScale={1}
            dashSize={totalLength}
            gapSize={totalLength}
            dashOffset={-dashOffset}
        />
    );
};
