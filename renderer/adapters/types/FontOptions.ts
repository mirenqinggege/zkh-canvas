import type {TextAlign} from '../../scene';

/**
 * 字体样式
 */
export type FontStyle = 'normal' | 'italic' | 'oblique';

/**
 * 字体配置选项
 */
export interface FontOptions {
  /** 字体大小 */
  fontSize: number;

  /** 字体名称 */
  fontFamily: string;

  /** 字体粗细 */
  fontWeight: string | number;

  /** 字体样式 */
  fontStyle?: FontStyle;

  /** 文本对齐 */
  textAlign: TextAlign;

  /** 文本基线 */
  textBaseline?: 'top' | 'center' | 'bottom';
}

/**
 * 将 FontOptions 转换为 Canvas font 字符串
 */
export function fontOptionsToString(options: FontOptions): string {
  const style = options.fontStyle || 'normal';
  const weight = String(options.fontWeight);
  const size = `${options.fontSize}px`;
  const family = options.fontFamily;

  return `${style} ${weight} ${size} ${family}`;
}
