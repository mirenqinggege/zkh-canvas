/**
 * 节点类型枚举
 */
export type NodeType = 'rect' | 'circle' | 'text' | 'textbox' | 'image' | 'group';

/**
 * 所有支持的节点类型列表
 */
export const SUPPORTED_NODE_TYPES: NodeType[] = [
  'rect',
  'circle',
  'text',
  'textbox',
  'image',
  'group',
];

/**
 * 检查是否为支持的节点类型
 */
export function isSupportedNodeType(type: string): type is NodeType {
  return SUPPORTED_NODE_TYPES.includes(type as NodeType);
}