import type {SceneNode} from '../SceneNode';

/**
 * 图片引用类型（平台无关）
 */
export type ImageHandle = unknown;

/**
 * 图片节点
 */
export interface ImageNode extends SceneNode {
  type: 'image';

  /** 图片源地址 */
  src: string;

  /** 加载后的图片对象（预加载后填充） */
  imageHandle?: ImageHandle;
}

/**
 * 创建图片节点
 */
export function createImageNode(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  src: string,
  options?: {
    opacity?: number;
    visible?: boolean;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
  }
): ImageNode {
  return {
    id,
    type: 'image',
    x,
    y,
    width,
    height,
    src,
    fill: null,
    stroke: null,
    strokeWidth: 0,
    opacity: options?.opacity ?? 1,
    visible: options?.visible ?? true,
    rotation: options?.rotation ?? 0,
    scaleX: options?.scaleX ?? 1,
    scaleY: options?.scaleY ?? 1,
  };
}
