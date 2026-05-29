/**
 * Fabric.js 5.x JSON 导出格式类型定义
 */

/**
 * 裁剪路径对象
 */
export interface FabricClipPath {
  type: 'circle' | 'rect';
  radius?: number;
  rx?: number;
  ry?: number;
  width?: number;
  height?: number;
}

/**
 * Fabric 对象基础属性
 */
export interface FabricObjectBase {
  type: string;
  version?: string;

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

  // 裁剪路径
  clipPath?: FabricClipPath;

  // 唯一标识
  id?: string;

  // 是否锁定（自定义扩展属性）
  locked?: boolean;
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
  fontStyle?: 'normal' | 'italic' | 'oblique';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
}

/**
 * 图片填充模式
 */
export type FillMode = 'fill' | 'cover' | 'contain';

/**
 * Image 对象
 */
export interface FabricImage extends FabricObjectBase {
  type: 'image';
  src?: string;
  crossOrigin?: string;
  fillMode?: FillMode;
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