// Shared interface for navigation nodes
export interface NavNode {
  name: string; // User-friendly name
  path: string; // URL path
  children?: NavNode[];
}
