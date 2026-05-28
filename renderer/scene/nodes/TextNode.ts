import type {SceneNode} from '../SceneNode';
import type {FontStyle} from '../../adapters/types/FontOptions';

/**
 * 文本对齐方式
 */
export type TextAlign = 'left' | 'center' | 'right';

/**
 * 文本节点
 */
export interface TextNode extends SceneNode {
  type: 'text' | 'textbox';

  /** 文本内容 */
  text: string;

  /** 字体大小 */
  fontSize: number;

  /** 字体名称 */
  fontFamily: string;

  /** 字体粗细 */
  fontWeight: string | number;

  /** 字体样式 */
  fontStyle: FontStyle;

  /** 文本对齐 */
  textAlign: TextAlign;
}

/**
 * 创建文本节点
 */
export function createTextNode(
  id: string,
  x: number,
  y: number,
  text: string,
  width: number,
  height: number,
  options?: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string | number;
    fontStyle?: FontStyle;
    textAlign?: TextAlign;
    fill?: string | null;
    stroke?: string | null;
    strokeWidth?: number;
    opacity?: number;
    visible?: boolean;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
  }
): TextNode {
  return {
    id,
    type: 'text',
    x,
    y,
    width,
    height,
    text,
    fontSize: options?.fontSize ?? 16,
    fontFamily: options?.fontFamily ?? 'sans-serif',
    fontWeight: options?.fontWeight ?? 'normal',
    fontStyle: options?.fontStyle ?? 'normal',
    textAlign: options?.textAlign ?? 'left',
    fill: options?.fill ?? '#000000',
    stroke: options?.stroke ?? null,
    strokeWidth: options?.strokeWidth ?? 1,
    opacity: options?.opacity ?? 1,
    visible: options?.visible ?? true,
    rotation: options?.rotation ?? 0,
    scaleX: options?.scaleX ?? 1,
    scaleY: options?.scaleY ?? 1,
  };
}
