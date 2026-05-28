import type {NodeType} from '../types';

/**
 * 场景节点基础接口
 * 所有节点都使用左上角坐标系
 */
export interface SceneNode {
  /** 唯一标识 */
  id: string;
  /** 节点类型 */
  type: NodeType;

  /** 位置（左上角坐标系） */
  x: number;
  y: number;

  /** 尺寸 */
  width: number;
  height: number;

  /** Transform */
  rotation: number; // 弧度
  scaleX: number;
  scaleY: number;

  /** 样式 */
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;

  /** 透明度 0-1 */
  opacity: number;

  /** 是否可见 */
  visible: boolean;
}

/**
 * 创建基础节点属性的辅助函数
 */
export function createBaseNodeProps(
  id: string,
  type: NodeType,
  x: number,
  y: number,
  width: number,
  height: number
): Omit<SceneNode, 'fill' | 'stroke' | 'strokeWidth' | 'opacity' | 'visible'> {
  return {
    id,
    type,
    x,
    y,
    width,
    height,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  };
}
