export type NodeType = 'category' | 'article' | 'virtual-frame';
export type NodeStatus = 'prototype' | 'production' | 'concept';

export interface Node {
  id: string;
  title: string;
  type: NodeType;
  label?: string; // e.g. "Project", "Experiment", "Thought"
  status?: 'concept' | 'prototype' | 'production' | 'archived';
  description?: string;
  content?: string; // Markdown content

  // Iframe Configuration (Replacing experimentUrl)
  iframeConfig?: {
    url: string;
    orientation: 'desktop' | 'mobile'; // desktop = 800x600, mobile = 450x800
  };

  gallery?: string[]; // Array of image URLs
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
