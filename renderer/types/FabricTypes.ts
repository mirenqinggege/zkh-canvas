/**
 * Fabric.js 5.x JSON 导出格式类型定义
 */

/**
 * Fabric 对象基础属性
 */
export interface FabricObjectBase {
  type: string;
  version: string;

  // 位置（Fabric 使用中心点坐标）
  left: number;
  top: number;
  width: number;
  height: number;

  // Transform
  scaleX?: number;
  scaleY?: number;
  angle?: number; // 角度，不是弧度

  // 坐标原点设置
  originX?: 'left' | 'center' | 'right';
  originY?: 'top' | 'center' | 'bottom';

  // 样式
  fill?: string | null;
  stroke?: string | null;
  strokeWidth?: number;
  opacity?: number;
  visible?: boolean;

  // 唯一标识
  id?: string;
}

/**
 * Rect 对象
 */
export interface FabricRect extends FabricObjectBase {
  type: 'rect';
  rx?: number;
  ry?: number;
}

/**
 * Circle 对象
 */
export interface FabricCircle extends FabricObjectBase {
  type: 'circle';
  radius: number;
}

/**
 * Text/Textbox 对象
 */
export interface FabricText extends FabricObjectBase {
  type: 'text' | 'textbox';
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
}

/**
 * Image 对象
 */
export interface FabricImage extends FabricObjectBase {
  type: 'image';
  src?: string;
  crossOrigin?: string;
}

/**
 * Group 对象
 */
export interface FabricGroup extends FabricObjectBase {
  type: 'group';
  objects: FabricObject[];
}

/**
 * 所有 Fabric 对象的联合类型
 */
export type FabricObject =
  | FabricRect
  | FabricCircle
  | FabricText
  | FabricImage
  | FabricGroup;

/**
 * Fabric.js 导出的完整 JSON 结构
 */
export interface FabricExportJSON {
  version: string;
  objects: FabricObject[];
  background?: string;
  width?: number;
  height?: number;
}