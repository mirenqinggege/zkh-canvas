/**
 * 名片模板 JSON 格式类型定义
 */

/**
 * 尺寸配置
 */
export interface CardSize {
  preset: string;
  width: number;
  height: number;
  unit: string;
}

/**
 * 背景图片配置
 */
export interface CardBackgroundImage {
  url: string;
  fillMode?: 'fill' | 'cover' | 'contain';
  position?: {
    x: number;
    y: number;
  };
}

/**
 * 背景配置
 */
export interface CardBackground {
  type: 'image' | 'color';
  image?: CardBackgroundImage;
  color?: string;
}

/**
 * 文本样式
 */
export interface TextFieldStyles {
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  color: string;
}

/**
 * 头像元素
 */
export interface AvatarElement {
  id: string;
  type: 'avatar';
  imageUrl: string;
  fillMode?: 'fill' | 'cover' | 'contain';
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number;
}

/**
 * 文本字段元素
 */
export interface TextFieldElement {
  id: string;
  type: 'text-field';
  fieldType: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  styles: TextFieldStyles;
  opacity?: number;
}

/**
 * 图片元素
 */
export interface ImageElement {
  id: string;
  type: 'image';
  imageUrl: string;
  fillMode?: 'fill' | 'cover' | 'contain';
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number;
}

/**
 * 矩形元素
 */
export interface RectElement {
  id: string;
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
  ry?: number;
  opacity?: number;
}

/**
 * 所有元素类型
 */
export type CardElement = AvatarElement | TextFieldElement | ImageElement | RectElement;

/**
 * 名片模板 JSON 结构
 */
export interface CardTemplateJSON {
  id: string;
  name: string;
  size: CardSize;
  background?: CardBackground;
  elements: CardElement[];
  createdAt?: string;
  updatedAt?: string;
}