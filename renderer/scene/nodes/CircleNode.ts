import type {SceneNode} from '../SceneNode';

/**
 * 圆形节点
 * 圆心位于 (x + width/2, y + height/2)
 */
export interface CircleNode extends SceneNode {
  type: 'circle';

  /** 半径 */
  radius: number;
}

/**
 * 创建圆形节点
 */
export function createCircleNode(
  id: string,
  x: number,
  y: number,
  radius: number,
  options?: {
    fill?: string | null;
    stroke?: string | null;
    strokeWidth?: number;
    opacity?: number;
    visible?: boolean;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
  }
): CircleNode {
  // 圆形的宽高等于 2 * radius
  const width = radius * 2;
  const height = radius * 2;

  return {
    id,
    type: 'circle',
    x,
    y,
    width,
    height,
    radius,
    fill: options?.fill ?? null,
    stroke: options?.stroke ?? null,
    strokeWidth: options?.strokeWidth ?? 1,
    opacity: options?.opacity ?? 1,
    visible: options?.visible ?? true,
    rotation: options?.rotation ?? 0,
    scaleX: options?.scaleX ?? 1,
    scaleY: options?.scaleY ?? 1,
  };
}
