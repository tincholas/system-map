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

    // Pulse Refs
    const pulseLineRef = useRef<any>(null);
    const glowLineRef = useRef<any>(null); // Ref for the glow layer
    const pulseOffsetRef = useRef(0);

    useFrame((state, delta) => {
        // Linear Draw-in Animation
        if (startTimeRef.current === null) {
            startTimeRef.current = state.clock.elapsedTime + animationDelay;
        }

        const elapsed = state.clock.elapsedTime - startTimeRef.current;

        if (elapsed >= 0 && progress < 1) {
            const newProgress = Math.min(elapsed / animationDuration, 1);
            setProgress(newProgress);
        }

        // Continuous Pulse Animation
        if (progress > 0.5) {
            pulseOffsetRef.current -= delta * 300; // Double speed (was 150)

            // Imperatively update material for Core Pulse
            if (pulseLineRef.current && pulseLineRef.current.material) {
                pulseLineRef.current.material.dashOffset = pulseOffsetRef.current;
                pulseLineRef.current.material.needsUpdate = true;
            }
            // Imperatively update material for Glow Pulse (Sync)
            if (glowLineRef.current && glowLineRef.current.material) {
                glowLineRef.current.material.dashOffset = pulseOffsetRef.current;
                glowLineRef.current.material.needsUpdate = true;
            }
        }
    });

    // Dash settings for Base Line (Draw-in)
    const baseDashOffset = totalLength * (1 - progress);

    // Dash settings for Pulse Line
    // Shorter pulses (was 80 -> ~40)
    const pulseDashSize = 40;
    const pulseGapSize = 1400; // Double gap (was 350)

    return (
        <group position={[0, 0, -0.1]}>
            {/* Base Line (Blue, draws in) */}
            <Line
                points={points}
                color="#22d3ee"
                lineWidth={3}
                transparent
                opacity={0.8 * progress}
                dashed
                dashScale={1}
                dashSize={totalLength}
                gapSize={totalLength}
                dashOffset={-baseDashOffset}
            />

            {/* Glow Layer (Wide, Faint, Blurred look) */}
            <Line
                ref={glowLineRef}
                points={points}
                color="#06b6d4" // Cyan-500 (Stronger color for glow)
                lineWidth={6} // Wide to simulate glow
                transparent
                opacity={0.15} // Very faint
                dashed
                dashScale={1}
                dashSize={pulseDashSize} // Same size, or slightly larger? Same size keeps it tight.
                gapSize={pulseGapSize}
                dashOffset={0}
                depthTest={false}
                position={[0, 0, 0.04]} // Behind core pulse
            />

            {/* Core Pulse (Thin, Bright) */}
            <Line
                ref={pulseLineRef}
                points={points}
                color="#e0f2fe" // White/Cyan
                lineWidth={3}
                transparent
                opacity={0.8 * progress} // Bright
                dashed
                dashScale={1}
                dashSize={pulseDashSize}
                gapSize={pulseGapSize}
                dashOffset={0}
                depthTest={false}
                position={[0, 0, 0.05]} // Top
            />
        </group>
    );
};
