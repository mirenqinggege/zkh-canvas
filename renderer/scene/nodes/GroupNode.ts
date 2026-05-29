import type {SceneNode} from '../SceneNode';

/**
 * 组节点
 * 包含子节点列表
 */
export interface GroupNode extends SceneNode {
  type: 'group';

  /** 子节点列表 */
  children: SceneNode[];
}

/**
 * 创建组节点
 */
export function createGroupNode(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  children: SceneNode[],
  options?: {
    opacity?: number;
    visible?: boolean;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    clip?: { type: 'circle' | 'rect'; radius?: number; rx?: number; ry?: number };
  }
): GroupNode {
  return {
    id,
    type: 'group',
    x,
    y,
    width,
    height,
    children,
    fill: null,
    stroke: null,
    strokeWidth: 0,
    opacity: options?.opacity ?? 1,
    visible: options?.visible ?? true,
    rotation: options?.rotation ?? 0,
    scaleX: options?.scaleX ?? 1,
    scaleY: options?.scaleY ?? 1,
    clip: options?.clip,
  };
}
