import type {SceneNode} from '../SceneNode';

/**
 * 图片引用类型（平台无关）
 */
export type ImageHandle = unknown;

/**
 * 图片填充模式
 */
export type FillMode = 'fill' | 'cover' | 'contain';

/**
 * 图片节点
 */
export interface ImageNode extends SceneNode {
  type: 'image';

  /** 图片源地址 */
  src: string;

  /** 加载后的图片对象（预加载后填充） */
  imageHandle?: ImageHandle;

  /** 图片原始宽度 */
  imageWidth?: number;

  /** 图片原始高度 */
  imageHeight?: number;

  /** 填充模式 */
  fillMode?: FillMode;
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
    fillMode?: FillMode;
    clip?: { type: 'circle' | 'rect'; radius?: number; rx?: number; ry?: number };
    locked?: boolean;
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
    fillMode: options?.fillMode ?? 'fill',
    clip: options?.clip,
    locked: options?.locked ?? false,
  };
}
