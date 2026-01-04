export type NodeType = 'category' | 'project' | 'experiment';
export type NodeStatus = 'prototype' | 'production' | 'concept';

export interface Node {
  id: string;
  parentId?: string; // If undefined, it's a root node
  type: NodeType;
  title: string;
  status?: NodeStatus;
  description?: string; // Short summary
  content?: string;     // Full Markdown content
  gallery?: string[];   // Array of image URLs
  mediaUrl?: string;
  children?: Node[];
}

export interface LayoutNode extends Node {
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
  branchHeight?: number; // Helper for layout calculation
  parentId?: string;     // ID of parent node for connection lines
}
