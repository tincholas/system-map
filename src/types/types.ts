export type NodeType = 'category' | 'project' | 'experiment' | 'experiment-preview';
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
  experimentUrl?: string; // URL for embedded experiment content
  children?: Node[];
}

export interface LayoutNode extends Node {
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
  branchHeight?: number;
  parentId?: string;
  isExpanded?: boolean; // True if this node is in expanded state
}
