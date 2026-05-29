import type {SceneNode} from '../SceneNode';

/**
 * 矩形节点
 */
export interface RectNode extends SceneNode {
  type: 'rect';

  /** 圆角半径 */
  rx: number;
  ry: number;
}

/**
 * 创建矩形节点
 */
export function createRectNode(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  options?: {
    rx?: number;
    ry?: number;
    fill?: string | null;
    stroke?: string | null;
    strokeWidth?: number;
    opacity?: number;
    visible?: boolean;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    clip?: { type: 'circle' | 'rect'; radius?: number; rx?: number; ry?: number };
    locked?: boolean;
  }
): RectNode {
  return {
    id,
    type: 'rect',
    x,
    y,
    width,
    height,
    rx: options?.rx ?? 0,
    ry: options?.ry ?? 0,
    fill: options?.fill ?? null,
    stroke: options?.stroke ?? null,
    strokeWidth: options?.strokeWidth ?? 1,
    opacity: options?.opacity ?? 1,
    visible: options?.visible ?? true,
    rotation: options?.rotation ?? 0,
    scaleX: options?.scaleX ?? 1,
    scaleY: options?.scaleY ?? 1,
    clip: options?.clip,
    locked: options?.locked ?? false,
  };
}
